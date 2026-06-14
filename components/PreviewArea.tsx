'use client';

import { Insurance, DEFAULT_COLOR, CIRCLED_NUMBERS } from '../constants/insurance';
import { calculateAge, toJapaneseCalendar, formatCreatedDate } from '../utils/helpers';

type CustomerInfo = {
  documentType: string;
  createdDate: string;
  customerName: string;
  birthday: string;
};

type Props = {
  showForm: boolean;
  onOpenForm: () => void;
  onOpenHelp: () => void;
  customerInfo: CustomerInfo;
  insurances: Insurance[];
};

const getCoverageLines = (text: string) => text.split('\n');
const getDefaultCoverageFontSize = (linesCount: number) => {
  if (linesCount <= 1) return 18;
  if (linesCount === 2) return 16;
  if (linesCount === 3) return 14;
  return 12;
};
const normalizeCoverageFontSize = (fontSize: number) => {
  if (!Number.isFinite(fontSize)) return 14;
  return Math.max(10, Math.min(fontSize, 28));
};
const getCoverageTextSizes = (text: string, sizes: number[] = []) => {
  const lines = getCoverageLines(text);
  const defaultSize = getDefaultCoverageFontSize(lines.length);
  return lines.map((_, index) => normalizeCoverageFontSize(sizes[index] ?? defaultSize));
};

export default function PreviewArea({ showForm, onOpenForm, onOpenHelp, customerInfo, insurances }: Props) {
  const currentAge = calculateAge(customerInfo.birthday);
  const totalPrice = insurances.reduce((sum, ins) => sum + ins.monthlyFee, 0);
  const width = 600;
  const paymentAxisWidth = width - 150;
  const currentAgeNumber = typeof currentAge === 'number' ? currentAge : null;
  const maxPaymentEndAge = insurances
    .filter(ins => ins.shapeType !== 'lifetime')
    .reduce((maxAge, ins) => Math.max(maxAge, ins.paymentEndAge), currentAgeNumber ?? 0);

  const ageToX = (age: number) => {
    if (currentAgeNumber === null) return 0;
    const endAge = Math.max(maxPaymentEndAge, currentAgeNumber + 1);
    const mapped = ((age - currentAgeNumber) / (endAge - currentAgeNumber)) * paymentAxisWidth;
    return Math.max(0, Math.min(mapped, paymentAxisWidth));
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
                  〈 {toJapaneseCalendar(customerInfo.birthday)}{customerInfo.birthday ? ' ' : ''}{currentAge || '〇'}歳 〉
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
                        <span className="premium-amount">{ins.monthlyFee.toLocaleString()}円</span>
                      </div>
                      <div className="premium-row-leader" aria-hidden="true" />
                    </div>
                  );
                })}
              </div>
              <div className="premium-total">
                {totalPrice.toLocaleString()}円
              </div>
            </div>
          </div>

          {/* 図形エリア */}
          <div className="chart-area">
            {insurances.map((ins, index) => {
              const startX = 0;
              const endX = ageToX(ins.paymentEndAge);
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
                        <rect x={startX} y={0} width={endX} height={shapeH} stroke={strokeColor} strokeWidth="2" fill={ins.color} fillOpacity={fillOpacity} />
                      )}
                      {ins.shapeType === 'triangle' && (
                        <polygon points={`${startX},0 ${startX},${shapeH} ${endX},${shapeH}`} stroke={strokeColor} strokeWidth="2" fill={ins.color} fillOpacity={fillOpacity} />
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
                  {currentAge || '--'}歳
                </div>
                {Array.from(new Set(insurances.filter(ins => ins.shapeType !== 'lifetime').map(ins => ins.paymentEndAge))).map(age => (
                  <div key={age} className="age-axis-point" style={{ left: ageToX(age) }}>
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
