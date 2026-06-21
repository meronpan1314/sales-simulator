'use client';

import React, { useState } from 'react';
import {
  Insurance,
  COMPANY_MASTER,
  INSURANCE_TYPES,
  DEFAULT_COLOR,
  DEFAULT_PAYMENT_FREQUENCY,
  DEFAULT_PREMIUM_CURRENCY,
  PAYMENT_FREQUENCY_LABELS,
  PREMIUM_CURRENCY_LABELS,
  PaymentFrequency,
  PremiumCurrency,
} from '../constants/insurance';
import { calculateAge, resolveReferenceAge, toJapaneseCalendar } from '../utils/helpers';
import { getCoverageTextSizes, normalizeCoverageFontSize } from '../utils/coverage';
import { CustomerInfo } from '../types/customer';
import DateField, { DateFieldKey, getTodayParts } from './DateField';
import InsuranceCard, { InsuranceNumberField } from './InsuranceCard';

export type { CustomerInfo };

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

const formLabelClass = 'mb-1 block text-sm font-bold text-gray-600';
const formInputClass = 'w-full rounded border bg-white p-3 text-base focus:border-blue-500 focus:outline-none';
const formCardClass = 'rounded-lg border bg-gray-50 p-4 lg:p-5';

export default function SidebarForm({
  onClose,
  customerInfo,
  setCustomerInfo,
  insurances,
  setInsurances,
  onDownloadPDF,
  isGeneratingPDF,
}: Props) {
  const [company, setCompany] = useState('');
  const [insuranceType, setInsuranceType] = useState('');
  const [coverageText, setCoverageText] = useState('');
  const [paymentEndAge, setPaymentEndAge] = useState<number | ''>('');
  const [monthlyFee, setMonthlyFee] = useState<number | ''>('');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(DEFAULT_PAYMENT_FREQUENCY);
  const [currency, setCurrency] = useState<PremiumCurrency>(DEFAULT_PREMIUM_CURRENCY);
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

  const updateDateField = (field: DateFieldKey, value: string) => {
    updateCustomerInfo(field, value);
  };

  const addInsurance = () => {
    if (!company) return alert('保険会社を入力してください');
    const requiresPaymentEndAge = shapeType !== 'lifetime';
    if (requiresPaymentEndAge && (paymentEndAge === '' || !Number.isFinite(paymentEndAge) || paymentEndAge <= 0)) {
      return alert('払込期間を入力してください');
    }
    if (paymentEndAge !== '' && (!Number.isFinite(paymentEndAge) || paymentEndAge <= 0)) {
      return alert('払込期間は1以上で入力してください');
    }
    if (monthlyFee === '' || !Number.isFinite(monthlyFee) || monthlyFee <= 0) {
      return alert('保険料を入力してください');
    }

    const master = COMPANY_MASTER[company] || { color: DEFAULT_COLOR, logo: '' };
    const newInsurance: Insurance = {
      id: Date.now(),
      company,
      insuranceType,
      coverageText,
      coverageTextSizes: getCoverageTextSizes(coverageText),
      paymentEndAge: requiresPaymentEndAge ? paymentEndAge : paymentEndAge || '',
      monthlyFee,
      paymentFrequency,
      currency,
      shapeType,
      color: master.color,
      logo: master.logo,
    };

    setInsurances([newInsurance, ...insurances]);
    setCompany('');
    setInsuranceType('');
    setCoverageText('');
    setPaymentEndAge('');
    setMonthlyFee('');
    setPaymentFrequency(DEFAULT_PAYMENT_FREQUENCY);
    setCurrency(DEFAULT_PREMIUM_CURRENCY);
    setShapeType('term');
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
    setInsurances(insurances.map(ins => (
      ins.id === id
        ? { ...ins, coverageText: text, coverageTextSizes: getCoverageTextSizes(text, ins.coverageTextSizes) }
        : ins
    )));
  };

  const updateCoverageTextSize = (id: number, lineIndex: number, fontSize: number) => {
    setInsurances(insurances.map(ins => {
      if (ins.id !== id) return ins;

      const coverageTextSizes = getCoverageTextSizes(ins.coverageText, ins.coverageTextSizes);
      coverageTextSizes[lineIndex] = normalizeCoverageFontSize(fontSize);
      return { ...ins, coverageTextSizes };
    }));
  };

  const updateInsuranceNumber = (id: number, field: InsuranceNumberField, value: string) => {
    setInsuranceNumberDrafts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));

    if (value === '') {
      setInsurances(insurances.map(ins => (
        ins.id === id && field === 'paymentEndAge' && ins.shapeType === 'lifetime'
          ? { ...ins, paymentEndAge: '' }
          : ins
      )));
      return;
    }

    const nextValue = Number(value);
    if (!Number.isFinite(nextValue) || nextValue <= 0) return;

    setInsurances(insurances.map(ins => ins.id === id ? { ...ins, [field]: nextValue } : ins));
  };

  const updateInsurancePaymentFrequency = (id: number, value: PaymentFrequency) => {
    setInsurances(insurances.map(ins => ins.id === id ? { ...ins, paymentFrequency: value } : ins));
  };

  const updateInsuranceCurrency = (id: number, value: PremiumCurrency) => {
    setInsurances(insurances.map(ins => ins.id === id ? { ...ins, currency: value } : ins));
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

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const newInsurances = [...insurances];
    const draggedItem = newInsurances.splice(draggedIndex, 1)[0];
    newInsurances.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setInsurances(newInsurances);
  };

  return (
    <div className="w-full lg:w-[460px] lg:h-full lg:overflow-y-auto border-b lg:border-r bg-white p-4 lg:p-6 shadow-xl lg:shrink-0 z-20 relative flex flex-col gap-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-bold lg:text-2xl">設定パネル</h2>
        <button onClick={onClose} className="rounded bg-gray-200 px-3 py-1 text-sm font-semibold transition-colors hover:bg-gray-300">
          閉じる ◀
        </button>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
        <p className="mb-3 text-sm font-bold text-blue-800">資料が完成したら出力</p>
        <button
          onClick={onDownloadPDF}
          disabled={isGeneratingPDF}
          className="w-full rounded bg-blue-600 py-3 font-bold text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isGeneratingPDF ? 'PDFを生成中...' : '📥 PDFをダウンロード'}
        </button>
      </div>

      <div className={formCardClass}>
        <h3 className="mb-4 border-b pb-2 text-lg font-bold text-gray-800">顧客情報</h3>
        <div className="space-y-4">
          <div>
            <label className={formLabelClass}>内容</label>
            <select value={customerInfo.documentType} onChange={e => updateCustomerInfo('documentType', e.target.value)} className={formInputClass}>
              <option>ご契約内容</option>
              <option>ご提案内容</option>
            </select>
          </div>

          <DateField
            field="createdDate"
            label="作成日"
            value={customerInfo.createdDate}
            yearStart={2000}
            yearEnd={currentYear + 1}
            placeholder="作成日を選択"
            isOpen={openDatePicker === 'createdDate'}
            showTodayButton
            onChange={updateDateField}
            onToggle={field => setOpenDatePicker(openDatePicker === field ? null : field)}
            onClose={() => setOpenDatePicker(null)}
          />

          <div>
            <label className={formLabelClass}>氏名</label>
            <input type="text" placeholder="氏名" value={customerInfo.customerName} onChange={e => updateCustomerInfo('customerName', e.target.value)} className={formInputClass} />
          </div>

          <DateField
            field="birthday"
            label="生年月日"
            value={customerInfo.birthday}
            yearStart={1926}
            yearEnd={currentYear}
            placeholder="生年月日を選択"
            isOpen={openDatePicker === 'birthday'}
            onChange={updateDateField}
            onToggle={field => setOpenDatePicker(openDatePicker === field ? null : field)}
            onClose={() => setOpenDatePicker(null)}
          />

          <div className="rounded bg-blue-100 p-3 text-center">
            {customerInfo.birthday && <span className="mb-1 block text-sm font-bold text-gray-600">{toJapaneseCalendar(customerInfo.birthday)}</span>}
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-sm text-gray-600">現在の年齢</span>
              <span className="text-2xl font-bold text-blue-800">{currentAgeLabel} 歳</span>
            </div>
            <label className="mt-3 flex items-center justify-between gap-3 border-t border-blue-200 pt-3 text-left">
              <span className="text-sm font-bold text-gray-700">シミュレーション時点</span>
              <span className="flex min-w-0 items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={customerInfo.referenceAge}
                  onChange={e => updateCustomerInfo('referenceAge', e.target.value)}
                  onBlur={normalizeReferenceAgeInput}
                  placeholder={typeof currentAge === 'number' ? String(currentAge) : '年齢'}
                  className="w-24 rounded border border-blue-200 bg-white px-3 py-2 text-right text-base font-bold text-blue-900 focus:border-blue-500 focus:outline-none"
                />
                <span className="shrink-0 text-sm font-bold text-gray-700">歳</span>
              </span>
            </label>
            <div className="mt-2 rounded bg-white/70 px-3 py-2 text-sm font-bold text-blue-900">
              払込開始: {referenceAgeLabel} 歳時点
            </div>
          </div>
        </div>
      </div>

      <div className={formCardClass}>
        <h3 className="mb-4 border-b pb-2 text-lg font-bold text-gray-800">保険の新規追加</h3>
        <div className="space-y-4">
          <div>
            <label className={formLabelClass}>保険会社</label>
            <input list="company-opts" value={company} onChange={e => setCompany(e.target.value)} placeholder="選択または直接入力" className={formInputClass} />
            <datalist id="company-opts">
              {Object.keys(COMPANY_MASTER).map(name => <option key={name} value={name} />)}
            </datalist>
          </div>
          <div>
            <label className={formLabelClass}>保険種類</label>
            <input list="type-opts" value={insuranceType} onChange={e => setInsuranceType(e.target.value)} placeholder="選択または直接入力" className={formInputClass} />
            <datalist id="type-opts">
              {INSURANCE_TYPES.map(type => <option key={type} value={type} />)}
            </datalist>
          </div>
          <div>
            <label className={formLabelClass}>保険金額・保障内容など</label>
            <textarea
              value={coverageText}
              onChange={e => setCoverageText(e.target.value)}
              placeholder="・日額5,000円&#13;&#10;・手術2.5万円"
              className="h-24 w-full rounded border bg-white p-3 text-base focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className={formLabelClass}>払込期間 (年齢)</label>
            <input type="number" min="1" value={paymentEndAge} onChange={e => setPaymentEndAge(e.target.value === '' ? '' : Number(e.target.value))} placeholder="65" className={formInputClass} />
          </div>
          <div>
            <label className={formLabelClass}>保険料</label>
            <div className="grid grid-cols-[minmax(0,1fr)_96px_88px] gap-2">
              <input type="number" min="1" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value === '' ? '' : Number(e.target.value))} placeholder="5000" className={formInputClass} />
              <select value={paymentFrequency} onChange={e => setPaymentFrequency(e.target.value as PaymentFrequency)} className={formInputClass}>
                {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select value={currency} onChange={e => setCurrency(e.target.value as PremiumCurrency)} className={formInputClass}>
                {Object.entries(PREMIUM_CURRENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={formLabelClass}>図形の種類</label>
            <select value={shapeType} onChange={e => setShapeType(e.target.value as ShapeType)} className={formInputClass}>
              <option value="term">定期（四角）</option>
              <option value="triangle">収入保障（三角）</option>
              <option value="lifetime">終身（矢印）</option>
            </select>
          </div>
          <button onClick={addInsurance} className="w-full rounded bg-gray-800 py-3 font-bold text-white transition-colors hover:bg-black">
            ＋ 保険を上に追加する
          </button>
        </div>
      </div>

      <div className={formCardClass}>
        <h3 className="mb-3 border-b pb-2 text-lg font-bold text-gray-800">登録済みの保険 ({insurances.length})</h3>
        {insurances.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">登録された保険はありません</p>
        ) : (
          <div className="space-y-3">
            {insurances.map((insurance, index) => (
              <InsuranceCard
                key={insurance.id}
                insurance={insurance}
                index={index}
                totalCount={insurances.length}
                isDragging={draggedIndex === index}
                numberDrafts={insuranceNumberDrafts[insurance.id] ?? {}}
                onDragStart={setDraggedIndex}
                onDragEnter={handleDragEnter}
                onDragEnd={() => setDraggedIndex(null)}
                onMove={moveInsurance}
                onRemove={removeInsurance}
                onCoverageTextChange={updateCoverageText}
                onCoverageTextSizeChange={updateCoverageTextSize}
                onNumberChange={updateInsuranceNumber}
                onNumberBlur={clearInsuranceNumberDraft}
                onPaymentFrequencyChange={updateInsurancePaymentFrequency}
                onCurrencyChange={updateInsuranceCurrency}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
