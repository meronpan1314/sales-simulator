import {
  Insurance,
  CIRCLED_NUMBERS,
  PAYMENT_FREQUENCY_LABELS,
  PREMIUM_CURRENCY_LABELS,
  PaymentFrequency,
  PremiumCurrency,
  getPaymentFrequency,
  getPremiumCurrency,
} from '../constants/insurance';
import { getCoverageLines, getCoverageTextSizes } from '../utils/coverage';

export type InsuranceNumberField = 'paymentEndAge' | 'monthlyFee';

type Props = {
  insurance: Insurance;
  index: number;
  totalCount: number;
  isDragging: boolean;
  numberDrafts: Partial<Record<InsuranceNumberField, string>>;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onRemove: (id: number) => void;
  onCoverageTextChange: (id: number, text: string) => void;
  onCoverageTextSizeChange: (id: number, lineIndex: number, fontSize: number) => void;
  onNumberChange: (id: number, field: InsuranceNumberField, value: string) => void;
  onNumberBlur: (id: number, field: InsuranceNumberField) => void;
  onPaymentFrequencyChange: (id: number, value: PaymentFrequency) => void;
  onCurrencyChange: (id: number, value: PremiumCurrency) => void;
};

const cardBaseClass = 'p-3 rounded shadow-sm relative cursor-move transition-all hover:border-gray-400';
const moveButtonClass = 'text-[12px] text-gray-500 disabled:opacity-20 leading-none p-1';
const editLabelClass = 'mb-1 block text-[11px] font-bold text-gray-500';
const editControlClass = 'flex items-center rounded border bg-gray-50 px-2 focus-within:border-blue-500 focus-within:bg-white';
const editInputClass = 'min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold text-gray-900 focus:outline-none';
const coverageNumberInputClass = 'w-full rounded border bg-white px-1 py-1 text-right text-xs font-semibold focus:border-blue-500 focus:outline-none';

export default function InsuranceCard({
  insurance,
  index,
  totalCount,
  isDragging,
  numberDrafts,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onMove,
  onRemove,
  onCoverageTextChange,
  onCoverageTextSizeChange,
  onNumberChange,
  onNumberBlur,
  onPaymentFrequencyChange,
  onCurrencyChange,
}: Props) {
  const reversedNumberIndex = totalCount - 1 - index;
  const numLabel = CIRCLED_NUMBERS[reversedNumberIndex] || '';
  const coverageLines = getCoverageLines(insurance.coverageText || '');
  const coverageTextSizes = getCoverageTextSizes(insurance.coverageText, insurance.coverageTextSizes);

  const getNumberValue = (field: InsuranceNumberField) => {
    return numberDrafts[field] ?? String(insurance[field]);
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => e.preventDefault()}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      className={`group ${cardBaseClass} ${isDragging ? 'border border-blue-400 bg-blue-50 opacity-30' : 'border bg-white'}`}
    >
      <button
        onClick={() => onRemove(insurance.id)}
        className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600 transition-colors hover:bg-red-200 lg:hidden lg:group-hover:flex"
        title="削除"
      >
        ×
      </button>

      <div className="mb-2 flex select-none items-center gap-1.5 pr-10">
        <div className="mr-1 flex flex-col lg:hidden">
          <button onClick={() => onMove(index, 'up')} disabled={index === 0} className={moveButtonClass}>▲</button>
          <button onClick={() => onMove(index, 'down')} disabled={index === totalCount - 1} className={moveButtonClass}>▼</button>
        </div>
        <span className="hidden text-sm font-bold text-gray-400 lg:inline">☰</span>
        <span className="text-sm font-bold text-gray-700">{numLabel}</span>
        <span className="max-w-[120px] truncate text-sm font-bold">{insurance.company}</span>
        <span className="truncate rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{insurance.insuranceType}</span>
      </div>

      <textarea
        value={insurance.coverageText}
        onChange={e => onCoverageTextChange(insurance.id, e.target.value)}
        placeholder="保障内容を編集できます"
        className="h-16 w-full resize-none rounded border p-2 text-sm focus:border-blue-500 focus:outline-none"
      />

      <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2">
        <p className="mb-1 text-[11px] font-bold text-gray-500">文字サイズ</p>
        <div className="flex flex-col gap-2">
          {coverageLines.map((_, lineIndex) => (
            <label key={lineIndex} className="grid w-full items-center gap-2 text-xs text-gray-600 [grid-template-columns:48px_minmax(0,1fr)_44px]">
              <span className="whitespace-nowrap font-bold">{lineIndex + 1}行目</span>
              <input
                type="range"
                min="10"
                max="28"
                value={coverageTextSizes[lineIndex]}
                onChange={e => onCoverageTextSizeChange(insurance.id, lineIndex, Number(e.target.value))}
                className="min-w-0 w-full accent-blue-600"
              />
              <input
                type="number"
                min="10"
                max="28"
                value={coverageTextSizes[lineIndex]}
                onChange={e => onCoverageTextSizeChange(insurance.id, lineIndex, Number(e.target.value))}
                className={coverageNumberInputClass}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label className={editLabelClass}>払込期間</label>
          <div className={editControlClass}>
            <input
              type="number"
              min="1"
              value={getNumberValue('paymentEndAge')}
              onChange={e => onNumberChange(insurance.id, 'paymentEndAge', e.target.value)}
              onBlur={() => onNumberBlur(insurance.id, 'paymentEndAge')}
              className={editInputClass}
            />
            <span className="shrink-0 pl-1 text-xs font-bold text-gray-500">歳</span>
          </div>
        </div>
        <div className="min-w-0">
          <label className={editLabelClass}>保険料</label>
          <div className={editControlClass}>
            <input
              type="number"
              min="1"
              value={getNumberValue('monthlyFee')}
              onChange={e => onNumberChange(insurance.id, 'monthlyFee', e.target.value)}
              onBlur={() => onNumberBlur(insurance.id, 'monthlyFee')}
              className={editInputClass}
            />
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label className={editLabelClass}>払方</label>
          <select
            value={getPaymentFrequency(insurance)}
            onChange={e => onPaymentFrequencyChange(insurance.id, e.target.value as PaymentFrequency)}
            className="w-full rounded border bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label className={editLabelClass}>通貨</label>
          <select
            value={getPremiumCurrency(insurance)}
            onChange={e => onCurrencyChange(insurance.id, e.target.value as PremiumCurrency)}
            className="w-full rounded border bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            {Object.entries(PREMIUM_CURRENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
