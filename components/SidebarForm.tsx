'use client';

import React, { useState } from 'react';
import { Insurance, COMPANY_MASTER, INSURANCE_TYPES, DEFAULT_COLOR, CIRCLED_NUMBERS } from '../constants/insurance';
import { calculateAge, resolveReferenceAge, toJapaneseCalendar } from '../utils/helpers';

export type CustomerInfo = {
  documentType: string;
  createdDate: string;
  customerName: string;
  birthday: string;
  referenceAge: string;
};

type Props = {
  onClose: () => void;
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  insurances: Insurance[];
  setInsurances: React.Dispatch<React.SetStateAction<Insurance[]>>;
  onDownloadPDF: () => void;
  isGeneratingPDF: boolean;
};

type ShapeType = Insurance['shapeType'];
type InsuranceNumberField = 'paymentEndAge' | 'monthlyFee';
type DateFieldKey = 'createdDate' | 'birthday';

type DateParts = {
  year: number;
  month: number;
  day: number;
};

const getCoverageLines = (text: string) => text.split('\n');
const getDefaultCoverageFontSize = (linesCount: number) => {
  if (linesCount <= 1) return 18;
  if (linesCount === 2) return 16;
  if (linesCount === 3) return 14;
  return 12;
};
const getCoverageTextSizes = (text: string, sizes: number[] = []) => {
  const lines = getCoverageLines(text);
  const defaultSize = getDefaultCoverageFontSize(lines.length);
  return lines.map((_, index) => sizes[index] ?? defaultSize);
};
const normalizeCoverageFontSize = (fontSize: number) => {
  if (!Number.isFinite(fontSize)) return 14;
  return Math.max(10, Math.min(fontSize, 28));
};
const parseDateValue = (value: string): DateParts | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return { year, month, day };
};
const toDateValue = ({ year, month, day }: DateParts) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
const clampDay = (year: number, month: number, day: number) => Math.min(day, getDaysInMonth(year, month));
const getTodayParts = (): DateParts => {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
};
const formatDateLabel = (value: string) => {
  const parts = parseDateValue(value);
  if (!parts) return '日付を選択';
  return `${parts.year}年${parts.month}月${parts.day}日`;
};
const getJapaneseYearLabel = (year: number) => {
  const japaneseYear = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
    era: 'long',
    year: 'numeric',
  }).format(new Date(year, 0, 1));

  return `${year}年（${japaneseYear}）`;
};

export default function SidebarForm({ onClose, customerInfo, setCustomerInfo, insurances, setInsurances, onDownloadPDF, isGeneratingPDF }: Props) {
  const [company, setCompany] = useState('');
  const [insuranceType, setInsuranceType] = useState('');
  const [coverageText, setCoverageText] = useState('');
  const [paymentEndAge, setPaymentEndAge] = useState<number | ''>('');
  const [monthlyFee, setMonthlyFee] = useState<number | ''>('');
  const [shapeType, setShapeType] = useState<ShapeType>('term');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [insuranceNumberDrafts, setInsuranceNumberDrafts] = useState<Record<number, Partial<Record<InsuranceNumberField, string>>>>({});
  const [openDatePicker, setOpenDatePicker] = useState<DateFieldKey | null>(null);

  const currentAge = calculateAge(customerInfo.birthday);
  const referenceAge = resolveReferenceAge(customerInfo.birthday, customerInfo.referenceAge);
  const currentAgeLabel = typeof currentAge === 'number' ? currentAge : '--';
  const referenceAgeLabel = typeof referenceAge === 'number' ? referenceAge : '--';
  const currentYear = getTodayParts().year;

  const updateCustomerInfo = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentEndAgeChange = (value: string) => {
    setPaymentEndAge(value === '' ? '' : Number(value));
  };
  const handleMonthlyFeeChange = (value: string) => {
    setMonthlyFee(value === '' ? '' : Number(value));
  };
  const handleReferenceAgeChange = (value: string) => {
    updateCustomerInfo('referenceAge', value);
  };
  const normalizeReferenceAgeInput = () => {
    const trimmedAge = customerInfo.referenceAge.trim();
    if (!trimmedAge) return;

    const selectedAge = Number(trimmedAge);
    if (!Number.isFinite(selectedAge) || !Number.isInteger(selectedAge) || selectedAge < 0) {
      updateCustomerInfo('referenceAge', '');
      return;
    }

    updateCustomerInfo('referenceAge', String(selectedAge));
  };

  const addInsurance = () => {
    if (!company) return alert('保険会社を入力してください');
    const master = COMPANY_MASTER[company] || { color: DEFAULT_COLOR, logo: '' };
    const newInsurance: Insurance = {
      id: Date.now(), company, insuranceType, coverageText, coverageTextSizes: getCoverageTextSizes(coverageText), paymentEndAge: paymentEndAge || 0, monthlyFee: monthlyFee || 0, shapeType, color: master.color, logo: master.logo,
    };
    setInsurances([newInsurance, ...insurances]);
    setCompany(''); setInsuranceType(''); setCoverageText(''); setPaymentEndAge(''); setMonthlyFee(''); setShapeType('term');
  };

  const removeInsurance = (id: number) => {
    setInsurances(insurances.filter(ins => ins.id !== id));
    setInsuranceNumberDrafts(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateCoverageText = (id: number, text: string) => {
    setInsurances(insurances.map(ins => ins.id === id ? { ...ins, coverageText: text, coverageTextSizes: getCoverageTextSizes(text, ins.coverageTextSizes) } : ins));
  };

  const updateCoverageTextSize = (id: number, lineIndex: number, fontSize: number) => {
    setInsurances(insurances.map(ins => {
      if (ins.id !== id) return ins;

      const coverageTextSizes = getCoverageTextSizes(ins.coverageText, ins.coverageTextSizes);
      coverageTextSizes[lineIndex] = normalizeCoverageFontSize(fontSize);
      return { ...ins, coverageTextSizes };
    }));
  };

  const getInsuranceNumberValue = (ins: Insurance, field: InsuranceNumberField) => {
    return insuranceNumberDrafts[ins.id]?.[field] ?? String(ins[field]);
  };

  const updateInsuranceNumber = (id: number, field: InsuranceNumberField, value: string) => {
    setInsuranceNumberDrafts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));

    if (value === '') return;
    setInsurances(insurances.map(ins => ins.id === id ? { ...ins, [field]: Number(value) } : ins));
  };

  const clearInsuranceNumberDraft = (id: number, field: InsuranceNumberField) => {
    setInsuranceNumberDrafts(prev => {
      if (prev[id]?.[field] === undefined) return prev;

      const next = { ...prev, [id]: { ...prev[id] } };
      delete next[id][field];

      if (Object.keys(next[id]).length === 0) {
        delete next[id];
      }

      return next;
    });
  };

  const moveInsurance = (index: number, direction: 'up' | 'down') => {
    const newInsurances = [...insurances];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newInsurances.length) return;

    const temp = newInsurances[index];
    newInsurances[index] = newInsurances[targetIndex];
    newInsurances[targetIndex] = temp;
    setInsurances(newInsurances);
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newInsurances = [...insurances];
    const draggedItem = newInsurances.splice(draggedIndex, 1)[0];
    newInsurances.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setInsurances(newInsurances);
  };
  const handleDragEnd = () => setDraggedIndex(null);

  const renderDateField = (
    field: DateFieldKey,
    label: string,
    yearStart: number,
    yearEnd: number,
    placeholder: string,
    showTodayButton = false,
  ) => {
    const value = customerInfo[field];
    const selected = parseDateValue(value);
    const fallback = selected ?? (field === 'birthday' ? { year: 1980, month: 1, day: 1 } : getTodayParts());
    const viewYear = fallback.year;
    const viewMonth = fallback.month;
    const viewDay = fallback.day;
    const years = Array.from({ length: yearEnd - yearStart + 1 }, (_, index) => yearEnd - index);
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const monthStartWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const dayCells = [
      ...Array.from({ length: monthStartWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    const changeDatePart = (nextParts: Partial<DateParts>) => {
      const nextYear = nextParts.year ?? viewYear;
      const nextMonth = nextParts.month ?? viewMonth;
      const nextDay = clampDay(nextYear, nextMonth, nextParts.day ?? viewDay);
      updateCustomerInfo(field, toDateValue({ year: nextYear, month: nextMonth, day: nextDay }));
    };

    return (
      <div className="date-field">
        <label className="form-label">{label}</label>
        <button
          type="button"
          onClick={() => setOpenDatePicker(openDatePicker === field ? null : field)}
          className={`date-trigger ${value ? '' : 'date-trigger-empty'}`}
          aria-expanded={openDatePicker === field}
        >
          <span>{value ? formatDateLabel(value) : placeholder}</span>
          <span className="date-trigger-icon">▾</span>
        </button>
        {openDatePicker === field && (
          <div className="date-popover">
            <div className="date-popover-header">
              <select
                value={viewYear}
                onChange={e => changeDatePart({ year: Number(e.target.value) })}
                className="date-select date-select-year"
              >
                {years.map(year => (
                  <option key={year} value={year}>{getJapaneseYearLabel(year)}</option>
                ))}
              </select>
              <select
                value={viewMonth}
                onChange={e => changeDatePart({ month: Number(e.target.value) })}
                className="date-select"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(month => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>
            </div>
            <div className="date-weekdays">
              {['日', '月', '火', '水', '木', '金', '土'].map(dayName => (
                <span key={dayName}>{dayName}</span>
              ))}
            </div>
            <div className="date-grid">
              {dayCells.map((day, index) => (
                day === null ? (
                  <span key={`empty-${index}`} className="date-day-empty" />
                ) : (
                  <button
                    type="button"
                    key={day}
                    onClick={() => {
                      changeDatePart({ day });
                      setOpenDatePicker(null);
                    }}
                    className={`date-day ${selected?.year === viewYear && selected.month === viewMonth && selected.day === day ? 'date-day-selected' : ''}`}
                  >
                    {day}
                  </button>
                )
              ))}
            </div>
            <div className="date-popover-actions">
              {showTodayButton && (
                <button
                  type="button"
                  onClick={() => {
                    updateCustomerInfo(field, toDateValue(getTodayParts()));
                    setOpenDatePicker(null);
                  }}
                  className="date-action"
                >
                  今日
                </button>
              )}
              <button
                type="button"
                onClick={() => updateCustomerInfo(field, '')}
                className="date-action date-action-muted"
              >
                クリア
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar-panel">
      <div className="sidebar-header">
        <h2 className="sidebar-title">設定パネル</h2>
        <button onClick={onClose} className="btn-close">
          閉じる ◀
        </button>
      </div>

      <div className="download-card">
        <p className="download-card-title">資料が完成したら出力</p>
        <button onClick={onDownloadPDF} disabled={isGeneratingPDF} className="btn-primary">
          {isGeneratingPDF ? 'PDFを生成中...' : '📥 PDFをダウンロード'}
        </button>
      </div>

      <div className="form-card">
        <h3 className="form-card-title">顧客情報</h3>
        <div className="form-stack">
          <div>
            <label className="form-label">内容</label>
            <select value={customerInfo.documentType} onChange={e => updateCustomerInfo('documentType', e.target.value)} className="form-input">
              <option>ご契約内容</option>
              <option>ご提案内容</option>
            </select>
          </div>
          {renderDateField('createdDate', '作成日', 1900, currentYear + 1, '作成日を選択', true)}
          <div>
            <label className="form-label">氏名</label>
            <input type="text" placeholder="氏名" value={customerInfo.customerName} onChange={e => updateCustomerInfo('customerName', e.target.value)} className="form-input" />
          </div>
          {renderDateField('birthday', '生年月日', 1900, currentYear, '生年月日を選択')}
          <div className="age-summary">
            {customerInfo.birthday && <span className="age-summary-calendar">{toJapaneseCalendar(customerInfo.birthday)}</span>}
            <div className="age-summary-row">
              <span className="age-summary-label">現在の年齢</span>
              <span className="age-summary-value">{currentAgeLabel} 歳</span>
            </div>
            <label className="reference-age-field">
              <span className="reference-age-label">シミュレーション時点</span>
              <span className="reference-age-control">
                <input
                  type="number"
                  min="0"
                  value={customerInfo.referenceAge}
                  onChange={e => handleReferenceAgeChange(e.target.value)}
                  onBlur={normalizeReferenceAgeInput}
                  placeholder={typeof currentAge === 'number' ? String(currentAge) : '年齢'}
                  className="reference-age-input"
                />
                <span className="reference-age-unit">歳</span>
              </span>
            </label>
            <div className="reference-age-result">
              払込開始: {referenceAgeLabel} 歳時点
            </div>
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-card-title">保険の新規追加</h3>
        <div className="form-stack">
          <div>
            <label className="form-label">保険会社</label>
            <input list="company-opts" value={company} onChange={e => setCompany(e.target.value)} placeholder="選択または直接入力" className="form-input" />
            <datalist id="company-opts">
              {Object.keys(COMPANY_MASTER).map(n => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div>
            <label className="form-label">保険種類</label>
            <input list="type-opts" value={insuranceType} onChange={e => setInsuranceType(e.target.value)} placeholder="選択または直接入力" className="form-input" />
            <datalist id="type-opts">
              {INSURANCE_TYPES.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div>
            <label className="form-label">保険金額・保障内容など</label>
            <textarea value={coverageText} onChange={e => setCoverageText(e.target.value)} placeholder="・日額5,000円&#13;&#10;・手術2.5万円" className="form-textarea" />
          </div>
          <div>
            <label className="form-label">払込期間 (年齢)</label>
            <input type="number" value={paymentEndAge} onChange={e => handlePaymentEndAgeChange(e.target.value)} placeholder="65" className="form-input" />
          </div>
          <div>
            <label className="form-label">月額保険料 (円)</label>
            <input type="number" value={monthlyFee} onChange={e => handleMonthlyFeeChange(e.target.value)} placeholder="5000" className="form-input" />
          </div>
          <div>
            <label className="form-label">図形の種類</label>
            <select value={shapeType} onChange={e => setShapeType(e.target.value as ShapeType)} className="form-input">
              <option value="term">定期（四角）</option>
              <option value="triangle">収入保障（三角）</option>
              <option value="lifetime">終身（矢印）</option>
            </select>
          </div>
          <button onClick={addInsurance} className="btn-dark">
            ＋ 保険を上に追加する
          </button>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-card-title-tight">登録済みの保険 ({insurances.length})</h3>
        {insurances.length === 0 ? (
          <p className="empty-insurance-message">登録された保険はありません</p>
        ) : (
          <div className="insurance-list">
            {insurances.map((ins, index) => {
              const reversedNumberIndex = insurances.length - 1 - index;
              const numLabel = CIRCLED_NUMBERS[reversedNumberIndex] || '';
              const coverageLines = getCoverageLines(ins.coverageText || '');
              const coverageTextSizes = getCoverageTextSizes(ins.coverageText, ins.coverageTextSizes);

              return (
                <div key={ins.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={e => e.preventDefault()} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} className={`insurance-card ${draggedIndex === index ? 'insurance-card-dragging' : ''}`}>
                  <button onClick={() => removeInsurance(ins.id)} className="btn-delete-insurance" title="削除">
                    ×
                  </button>
                  <div className="insurance-card-header">
                    <div className="insurance-mobile-controls">
                      <button onClick={() => moveInsurance(index, 'up')} disabled={index === 0} className="btn-move-insurance">▲</button>
                      <button onClick={() => moveInsurance(index, 'down')} disabled={index === insurances.length - 1} className="btn-move-insurance">▼</button>
                    </div>
                    <span className="insurance-drag-icon">☰</span>
                    <span className="insurance-number">{numLabel}</span>
                    <span className="insurance-company-name">{ins.company}</span>
                    <span className="insurance-type-pill">{ins.insuranceType}</span>
                  </div>
                  <div>
                    <textarea value={ins.coverageText} onChange={e => updateCoverageText(ins.id, e.target.value)} placeholder="保障内容を編集できます" className="edit-textarea" />
                  </div>
                  <div className="coverage-size-panel">
                    <p className="coverage-size-title">文字サイズ</p>
                    <div className="coverage-size-list">
                      {coverageLines.map((_, lineIndex) => (
                        <label key={lineIndex} className="coverage-size-row">
                          <span className="coverage-size-label">{lineIndex + 1}行目</span>
                          <input
                            type="range"
                            min="10"
                            max="28"
                            value={coverageTextSizes[lineIndex]}
                            onChange={e => updateCoverageTextSize(ins.id, lineIndex, Number(e.target.value))}
                            className="coverage-size-slider"
                          />
                          <input
                            type="number"
                            min="10"
                            max="28"
                            value={coverageTextSizes[lineIndex]}
                            onChange={e => updateCoverageTextSize(ins.id, lineIndex, Number(e.target.value))}
                            className="coverage-size-input"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="insurance-edit-grid">
                    <div className="insurance-edit-field">
                      <label className="insurance-edit-label">払込期間</label>
                      <div className="insurance-edit-control">
                        <input
                          type="number"
                          value={getInsuranceNumberValue(ins, 'paymentEndAge')}
                          onChange={e => updateInsuranceNumber(ins.id, 'paymentEndAge', e.target.value)}
                          onBlur={() => clearInsuranceNumberDraft(ins.id, 'paymentEndAge')}
                          className="insurance-edit-input"
                        />
                        <span className="insurance-edit-unit">歳</span>
                      </div>
                    </div>
                    <div className="insurance-edit-field">
                      <label className="insurance-edit-label">月額保険料</label>
                      <div className="insurance-edit-control">
                        <input
                          type="number"
                          value={getInsuranceNumberValue(ins, 'monthlyFee')}
                          onChange={e => updateInsuranceNumber(ins.id, 'monthlyFee', e.target.value)}
                          onBlur={() => clearInsuranceNumberDraft(ins.id, 'monthlyFee')}
                          className="insurance-edit-input"
                        />
                        <span className="insurance-edit-unit">円</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
