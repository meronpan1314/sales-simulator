'use client';

import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import {
  Insurance,
  DEFAULT_COLOR,
  CIRCLED_NUMBERS,
  PREMIUM_CURRENCY_LABELS,
  PAYMENT_FREQUENCY_TOTAL_LABELS,
  formatPremium,
  getPaymentFrequency,
  getPremiumCurrency,
  PaymentFrequency,
  PremiumCurrency,
} from '../constants/insurance';
import { resolveReferenceAge, toJapaneseCalendar, formatCreatedDate } from '../utils/helpers';
import { getCoverageLines, getCoverageTextSizes } from '../utils/coverage';
import { CustomerInfo } from '../types/customer';

type Props = {
  showForm: boolean;
  onOpenForm: () => void;
  onOpenHelp: () => void;
  customerInfo: CustomerInfo;
  insurances: Insurance[];
};

const MIN_AGE_X_GAP = 32;
const MIN_SHAPE_WIDTH = 24;

export default function PreviewArea({ showForm, onOpenForm, onOpenHelp, customerInfo, insurances }: Props) {
  const [ageXOverrides, setAgeXOverrides] = useState<Record<number, number>>({});
  const [draggingPaymentEndAge, setDraggingPaymentEndAge] = useState<number | null>(null);
  const draggingPaymentEndAgeRef = useRef<number | null>(null);
  const dragSvgRef = useRef<SVGSVGElement | null>(null);
  const referenceAge = resolveReferenceAge(customerInfo.birthday, customerInfo.referenceAge);
  const referenceAgeLabel = typeof referenceAge === 'number' ? referenceAge : '〇';
  const hasSelectedReferenceAge = customerInfo.referenceAge.trim() !== '';
  const premiumTotals = insurances.reduce<Record<PaymentFrequency, Partial<Record<PremiumCurrency, number>>>>((totals, ins) => {
    const frequency = getPaymentFrequency(ins);
    const currency = getPremiumCurrency(ins);
    totals[frequency][currency] = (totals[frequency][currency] ?? 0) + ins.monthlyFee;
    return totals;
  }, { monthly: {}, yearly: {} });
  const premiumTotalGroups = (['monthly', 'yearly'] as PaymentFrequency[])
    .map(frequency => ({
      frequency,
      amounts: (['jpy', 'usd'] as PremiumCurrency[])
        .map(currency => ({ currency, amount: premiumTotals[frequency][currency] }))
        .filter((item): item is { currency: PremiumCurrency; amount: number } => item.amount !== undefined),
    }))
    .filter(group => group.amounts.length > 0);
  const width = 600;
  const paymentAxisWidth = width - 150;
  const referenceAgeNumber = typeof referenceAge === 'number' ? referenceAge : null;
  const paymentEndAges = insurances
    .flatMap(ins => (
      ins.shapeType !== 'lifetime' && typeof ins.paymentEndAge === 'number'
        ? [ins.paymentEndAge]
        : []
    ));
  const uniquePaymentEndAges = Array.from(new Set(paymentEndAges)).sort((a, b) => a - b);
  const maxPaymentEndAge = paymentEndAges.reduce((maxAge, age) => Math.max(maxAge, age), referenceAgeNumber ?? 0);

  const ageToX = (age: number) => {
    if (referenceAgeNumber === null) return 0;
    const endAge = Math.max(maxPaymentEndAge, referenceAgeNumber + 1);
    const mapped = ((age - referenceAgeNumber) / (endAge - referenceAgeNumber)) * paymentAxisWidth;
    return Math.max(0, Math.min(mapped, paymentAxisWidth));
  };

  const displayAgeToX = (age: number) => {
    return ageXOverrides[age] ?? ageToX(age);
  };

  const getShapeEndX = (insurance: Insurance) => {
    if (typeof insurance.paymentEndAge !== 'number') return 0;

    return displayAgeToX(insurance.paymentEndAge);
  };

  const getAgeXBounds = (age: number) => {
    const ageIndex = uniquePaymentEndAges.indexOf(age);
    const previousAge = uniquePaymentEndAges[ageIndex - 1];
    const nextAge = uniquePaymentEndAges[ageIndex + 1];
    const minX = previousAge === undefined
      ? MIN_SHAPE_WIDTH
      : displayAgeToX(previousAge) + MIN_AGE_X_GAP;
    const maxX = nextAge === undefined
      ? paymentAxisWidth
      : displayAgeToX(nextAge) - MIN_AGE_X_GAP;

    return minX <= maxX
      ? { minX, maxX }
      : { minX: displayAgeToX(age), maxX: displayAgeToX(age) };
  };

  const updateAgeXFromPointer = (clientX: number, paymentEndAge: number) => {
    if (!dragSvgRef.current) return;

    const rect = dragSvgRef.current.getBoundingClientRect();
    const { minX, maxX } = getAgeXBounds(paymentEndAge);
    const nextX = Math.max(minX, Math.min(clientX - rect.left, maxX));
    setAgeXOverrides(prev => ({ ...prev, [paymentEndAge]: nextX }));
  };

  const handleResizePointerDown = (event: PointerEvent<SVGCircleElement>, insurance: Insurance) => {
    if (typeof insurance.paymentEndAge !== 'number') return;

    event.preventDefault();
    event.stopPropagation();
    setDraggingPaymentEndAge(insurance.paymentEndAge);
    draggingPaymentEndAgeRef.current = insurance.paymentEndAge;
    dragSvgRef.current = event.currentTarget.ownerSVGElement;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateAgeXFromPointer(event.clientX, insurance.paymentEndAge);
  };

  const handleResizePointerMove = (event: PointerEvent<SVGCircleElement>, insurance: Insurance) => {
    if (draggingPaymentEndAgeRef.current !== insurance.paymentEndAge || typeof insurance.paymentEndAge !== 'number') return;

    updateAgeXFromPointer(event.clientX, insurance.paymentEndAge);
  };

  const handleResizePointerEnd = (event: PointerEvent<SVGCircleElement>) => {
    setDraggingPaymentEndAge(null);
    draggingPaymentEndAgeRef.current = null;
    dragSvgRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="preview-shell">

      {/* ボタン群 */}
      <div className="preview-toolbar">
        {!showForm && (
          <button onClick={onOpenForm} className="btn-open-sidebar">
            ▶ 設定パネルを開く
          </button>
        )}
        <button
          onClick={onOpenHelp}
          className="btn-help"
        >
          ?
        </button>
      </div>

      <div className="preview-scroll">
        <div id="pdf-export-area" className="pdf-page">

          {/* ヘッダー部分 */}
          <div className="pdf-header">
            <div>
              <p className="document-type">{customerInfo.documentType}</p>
              <h1 className="customer-heading">
                {customerInfo.customerName || '     '} 様
                <span className="customer-age">
                  〈 {toJapaneseCalendar(customerInfo.birthday)}{customerInfo.birthday ? ' ' : ''}{referenceAgeLabel}歳{hasSelectedReferenceAge ? '時点' : ''} 〉
                </span>
              </h1>
              <p className="created-date">{formatCreatedDate(customerInfo.createdDate)} 作成</p>
            </div>
            <div className="premium-summary">
              <p className="premium-summary-title">保険料内訳</p>
              <div className="premium-summary-list">
                {insurances.map((ins, index) => {
                  const reversedNumberIndex = insurances.length - 1 - index;
                  const numLabel = CIRCLED_NUMBERS[reversedNumberIndex] || '';
                  return (
                    <div key={ins.id} className="premium-row">
                      <div className="premium-row-main">
                        <span className="premium-name">{numLabel}{ins.company} {ins.insuranceType}</span>
                        <span className="premium-amount">{formatPremium(ins.monthlyFee, getPaymentFrequency(ins), getPremiumCurrency(ins))}</span>
                      </div>
                      <div className="premium-row-leader" aria-hidden="true" />
                    </div>
                  );
                })}
              </div>
              <div className="premium-total">
                <span className="premium-total-heading">合計</span>
                {premiumTotalGroups.length === 0 ? (
                  <span className="premium-total-empty">0円</span>
                ) : (
                  <div className="premium-total-groups">
                    {premiumTotalGroups.map(group => (
                      <div
                        key={group.frequency}
                        className={`premium-total-group ${group.frequency === 'monthly' ? 'premium-total-group-monthly' : 'premium-total-group-yearly'}`}
                      >
                        <span className="premium-total-label">{PAYMENT_FREQUENCY_TOTAL_LABELS[group.frequency]}</span>
                        <div className="premium-total-amounts">
                          {group.amounts.map(({ currency, amount }) => (
                            <div key={currency} className="premium-total-amount">
                              {amount.toLocaleString()}{PREMIUM_CURRENCY_LABELS[currency]}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 図形エリア */}
          <div className="chart-area">
            {insurances.map((ins, index) => {
              const startX = 0;
              const endX = getShapeEndX(ins);
              const isTriangle = ins.shapeType === 'triangle';
              const shapeH = isTriangle ? 140 : 100;
              const isDefault = ins.color === DEFAULT_COLOR;
              const fillOpacity = isDefault ? "1" : "0.12";
              const strokeColor = isDefault ? "#a4c2f4" : ins.color;

              const reversedNumberIndex = insurances.length - 1 - index;
              const numLabel = CIRCLED_NUMBERS[reversedNumberIndex] || '';

              const positionClass = isTriangle ? 'chart-shape-text-triangle' : 'chart-shape-text-default';
              const coverageLines = getCoverageLines(ins.coverageText || '');
              const coverageTextSizes = getCoverageTextSizes(ins.coverageText, ins.coverageTextSizes);

              let maxTextWidth: number | 'none' = Math.max(80, endX - 20);
              if (ins.shapeType === 'lifetime') {
                maxTextWidth = width - 30;
              } else if (isTriangle) {
                maxTextWidth = 'none';
              }

              return (
                <div key={ins.id} className="chart-row" style={{ height: shapeH }}>
                  <div className="chart-label-column" style={{ height: shapeH }}>
                    <span className="chart-number">{numLabel}</span>
                    <div className="chart-company-block">
                      {ins.logo && (
                        <img src={ins.logo} alt={ins.company} className="chart-logo" />
                      )}
                      <h2 className="chart-company-name">{ins.company}</h2>
                      <p className="chart-insurance-type">{ins.insuranceType}</p>
                    </div>
                  </div>

                  <div className="chart-shape-column" style={{ height: shapeH }}>
                    <div
                      className={`chart-shape-text ${positionClass}`}
                      style={{
                        maxWidth: maxTextWidth,
                        textShadow: '0px 0px 4px rgba(255,255,255,0.8)',
                        whiteSpace: 'pre',
                        wordBreak: 'keep-all',
                        overflowWrap: 'normal',
                        ...(isTriangle ? { top: 'auto', bottom: 16, transform: 'none' } : {}),
                      }}
                    >
                      {coverageLines.map((line, lineIndex) => (
                        <span
                          key={lineIndex}
                          className="chart-shape-text-line"
                          style={{ fontSize: coverageTextSizes[lineIndex], lineHeight: 1.18, whiteSpace: 'nowrap', wordBreak: 'keep-all', overflowWrap: 'normal' }}
                        >
                          {line || ' '}
                        </span>
                      ))}
                    </div>

                    <svg width={width + 50} height={shapeH} className="chart-svg">
                      {ins.shapeType === 'term' && (
                        <>
                          <rect x={startX} y={0} width={endX} height={shapeH} stroke={strokeColor} strokeWidth="2" fill={ins.color} fillOpacity={fillOpacity} />
                          {typeof ins.paymentEndAge === 'number' && (
                            <circle
                              cx={endX}
                              cy={shapeH - 8}
                              r="7"
                              fill="transparent"
                              opacity="0"
                              className={`chart-resize-handle pdf-exclude ${draggingPaymentEndAge === ins.paymentEndAge ? 'chart-resize-handle-active' : ''}`}
                              onPointerDown={event => handleResizePointerDown(event, ins)}
                              onPointerMove={event => handleResizePointerMove(event, ins)}
                              onPointerUp={handleResizePointerEnd}
                              onPointerCancel={handleResizePointerEnd}
                              aria-label="払込年齢の表示位置を調整"
                            />
                          )}
                        </>
                      )}
                      {ins.shapeType === 'triangle' && (
                        <>
                          <polygon points={`${startX},0 ${startX},${shapeH} ${endX},${shapeH}`} stroke={strokeColor} strokeWidth="2" fill={ins.color} fillOpacity={fillOpacity} />
                          {typeof ins.paymentEndAge === 'number' && (
                            <circle
                              cx={endX}
                              cy={shapeH - 8}
                              r="7"
                              fill="transparent"
                              opacity="0"
                              className={`chart-resize-handle pdf-exclude ${draggingPaymentEndAge === ins.paymentEndAge ? 'chart-resize-handle-active' : ''}`}
                              onPointerDown={event => handleResizePointerDown(event, ins)}
                              onPointerMove={event => handleResizePointerMove(event, ins)}
                              onPointerUp={handleResizePointerEnd}
                              onPointerCancel={handleResizePointerEnd}
                              aria-label="払込年齢の表示位置を調整"
                            />
                          )}
                        </>
                      )}
                      {ins.shapeType === 'lifetime' && (
                        <polygon points={`${startX},0 ${width},0 ${width + 25},${shapeH / 2} ${width},${shapeH} ${startX},${shapeH}`} stroke={strokeColor} strokeWidth="2" fill={ins.color} fillOpacity={fillOpacity} />
                      )}
                    </svg>
                  </div>
                </div>
              );
            })}

            {/* 年齢軸 */}
            <div className="age-axis">
              <div className="age-axis-label-spacer" />
              <div className="age-axis-track">
                <div className="age-axis-point" style={{ left: 0 }}>
                  {typeof referenceAge === 'number' ? referenceAge : '--'}歳
                </div>
                {uniquePaymentEndAges.map(age => (
                  <div key={age} className="age-axis-point" style={{ left: displayAgeToX(age) }}>
                    {age}歳
                  </div>
                ))}
                {insurances.some(ins => ins.shapeType === 'lifetime') && (
                  <div className="age-axis-lifetime" style={{ left: width + 10 }}>
                    一生涯
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
