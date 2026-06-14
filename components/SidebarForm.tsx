'use client';

import React, { useState } from 'react';
import { Insurance, COMPANY_MASTER, INSURANCE_TYPES, DEFAULT_COLOR, CIRCLED_NUMBERS } from '../constants/insurance';
import { calculateAge, toJapaneseCalendar } from '../utils/helpers';

export type CustomerInfo = {
  documentType: string;
  createdDate: string;
  customerName: string;
  birthday: string;
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

export default function SidebarForm({ onClose, customerInfo, setCustomerInfo, insurances, setInsurances, onDownloadPDF, isGeneratingPDF }: Props) {
  const [company, setCompany] = useState('');
  const [insuranceType, setInsuranceType] = useState('');
  const [coverageText, setCoverageText] = useState('');
  const [paymentEndAge, setPaymentEndAge] = useState<number | ''>('');
  const [monthlyFee, setMonthlyFee] = useState<number | ''>('');
  const [shapeType, setShapeType] = useState<ShapeType>('term');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [insuranceNumberDrafts, setInsuranceNumberDrafts] = useState<Record<number, Partial<Record<InsuranceNumberField, string>>>>({});

  const currentAge = calculateAge(customerInfo.birthday);

  const handlePaymentEndAgeChange = (value: string) => {
    setPaymentEndAge(value === '' ? '' : Number(value));
  };
  const handleMonthlyFeeChange = (value: string) => {
    setMonthlyFee(value === '' ? '' : Number(value));
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
            <select value={customerInfo.documentType} onChange={e => setCustomerInfo({ ...customerInfo, documentType: e.target.value })} className="form-input">
              <option>ご契約内容</option>
              <option>ご提案内容</option>
            </select>
          </div>
          <div>
            <label className="form-label">作成日</label>
            <input type="date" value={customerInfo.createdDate} onChange={e => setCustomerInfo({ ...customerInfo, createdDate: e.target.value })} className="form-input" />
          </div>
          <div>
            <label className="form-label">氏名</label>
            <input type="text" placeholder="氏名" value={customerInfo.customerName} onChange={e => setCustomerInfo({ ...customerInfo, customerName: e.target.value })} className="form-input" />
          </div>
          <div>
            <label className="form-label">生年月日</label>
            <input type="date" value={customerInfo.birthday} onChange={e => setCustomerInfo({ ...customerInfo, birthday: e.target.value })} className="form-input" />
          </div>
          <div className="age-summary">
            {customerInfo.birthday && <span className="age-summary-calendar">{toJapaneseCalendar(customerInfo.birthday)}</span>}
            <span className="age-summary-label">現在の年齢:</span>
            <span className="age-summary-value">{currentAge || '--'} 歳</span>
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
