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

export default function SidebarForm({ onClose, customerInfo, setCustomerInfo, insurances, setInsurances, onDownloadPDF, isGeneratingPDF }: Props) {
  const [company, setCompany] = useState('');
  const [insuranceType, setInsuranceType] = useState('');
  const [coverageText, setCoverageText] = useState('');
  const [paymentEndAge, setPaymentEndAge] = useState(65);
  const [monthlyFee, setMonthlyFee] = useState(5000);
  const [shapeType, setShapeType] = useState<'term' | 'triangle' | 'lifetime'>('term');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const currentAge = calculateAge(customerInfo.birthday);

  const addInsurance = () => {
    if (!company) return alert('保険会社を入力してください');
    const master = COMPANY_MASTER[company] || { color: DEFAULT_COLOR, logo: '' };
    const newInsurance: Insurance = {
      id: Date.now(), company, insuranceType, coverageText, paymentEndAge, monthlyFee, shapeType, color: master.color, logo: master.logo,
    };
    setInsurances([newInsurance, ...insurances]);
    setCompany(''); setInsuranceType(''); setCoverageText(''); setPaymentEndAge(65); setMonthlyFee(5000); setShapeType('term');
  };

  const removeInsurance = (id: number) => {
    setInsurances(insurances.filter(ins => ins.id !== id));
  };

  const updateCoverageText = (id: number, text: string) => {
    setInsurances(insurances.map(ins => ins.id === id ? { ...ins, coverageText: text } : ins));
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
    <div className="w-full lg:w-[460px] lg:h-full lg:overflow-y-auto border-b lg:border-r bg-white p-4 lg:p-6 shadow-xl lg:shrink-0 z-20 relative flex flex-col gap-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl lg:text-2xl font-bold">設定パネル</h2>
        <button onClick={onClose} className="rounded bg-gray-200 px-3 py-1 text-sm font-semibold hover:bg-gray-300">
          閉じる ◀
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-800 font-bold mb-3">資料が完成したら出力</p>
        <button onClick={onDownloadPDF} disabled={isGeneratingPDF} className={`w-full py-3 rounded text-white font-bold shadow-md transition-all ${isGeneratingPDF ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {isGeneratingPDF ? 'PDFを生成中...' : '📥 PDFをダウンロード'}
        </button>
      </div>

      <div className="rounded-lg border bg-gray-50 p-4 lg:p-5">
        <h3 className="mb-4 text-lg font-bold border-b pb-2">顧客情報</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">内容</label>
            <select value={customerInfo.documentType} onChange={e => setCustomerInfo({...customerInfo, documentType: e.target.value})} className="w-full rounded border p-3 text-base">
              <option>ご契約内容</option>
              <option>ご提案内容</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">作成日</label>
            <input type="date" value={customerInfo.createdDate} onChange={e => setCustomerInfo({...customerInfo, createdDate: e.target.value})} className="w-full rounded border p-3 text-base" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">氏名</label>
            <input type="text" placeholder="氏名" value={customerInfo.customerName} onChange={e => setCustomerInfo({...customerInfo, customerName: e.target.value})} className="w-full rounded border p-3 text-base" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">生年月日</label>
            <input type="date" value={customerInfo.birthday} onChange={e => setCustomerInfo({...customerInfo, birthday: e.target.value})} className="w-full rounded border p-3 text-base" />
          </div>
          <div className="rounded bg-blue-100 p-3 text-center">
            {customerInfo.birthday && <span className="text-sm text-gray-600 font-bold mb-1 block">{toJapaneseCalendar(customerInfo.birthday)}</span>}
            <span className="text-sm text-gray-600 mr-2">現在の年齢:</span>
            <span className="text-2xl font-bold text-blue-800">{currentAge || '--'} 歳</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-gray-50 p-4 lg:p-5">
        <h3 className="mb-4 text-lg font-bold border-b pb-2">保険の新規追加</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">保険会社</label>
            <input list="company-opts" value={company} onChange={e => setCompany(e.target.value)} placeholder="選択または直接入力" className="w-full rounded border p-3 text-base" />
            <datalist id="company-opts">
              {Object.keys(COMPANY_MASTER).map(n => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">保険種類</label>
            <input list="type-opts" value={insuranceType} onChange={e => setInsuranceType(e.target.value)} placeholder="選択または直接入力" className="w-full rounded border p-3 text-base" />
            <datalist id="type-opts">
              {INSURANCE_TYPES.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">保険金額・保障内容など</label>
            <textarea value={coverageText} onChange={e => setCoverageText(e.target.value)} placeholder="・日額5,000円&#13;&#10;・手術2.5万円" className="h-24 w-full rounded border p-3 text-base" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">払込期間 (年齢)</label>
            <input type="number" value={paymentEndAge} onChange={e => setPaymentEndAge(Number(e.target.value))} className="w-full rounded border p-3 text-base" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">月額保険料 (円)</label>
            <input type="number" value={monthlyFee} onChange={e => setMonthlyFee(Number(e.target.value))} className="w-full rounded border p-3 text-base" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">図形の種類</label>
            <select value={shapeType} onChange={e => setShapeType(e.target.value as any)} className="w-full rounded border p-3 text-base">
              <option value="term">定期（四角）</option>
              <option value="triangle">収入保障（三角）</option>
              <option value="lifetime">終身（矢印）</option>
            </select>
          </div>
          <button onClick={addInsurance} className="w-full rounded bg-gray-800 py-3 font-bold text-white hover:bg-black transition-colors">
            ＋ 保険を上に追加する
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-gray-50 p-4 lg:p-5">
        <h3 className="mb-3 text-lg font-bold border-b pb-2">登録済みの保険 ({insurances.length})</h3>
        {insurances.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">登録された保険はありません</p>
        ) : (
          <div className="space-y-3">
            {insurances.map((ins, index) => {
              const reversedNumberIndex = insurances.length - 1 - index;
              const numLabel = CIRCLED_NUMBERS[reversedNumberIndex] || '';

              return (
                <div key={ins.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={e => e.preventDefault()} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} className={`p-3 bg-white border rounded shadow-sm relative group cursor-move transition-all ${draggedIndex === index ? 'opacity-30 border-blue-400 bg-blue-50' : 'hover:border-gray-400'}`}>
                  <button onClick={() => removeInsurance(ins.id)} className="absolute top-2 right-2 flex lg:hidden group-hover:flex items-center justify-center w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-xs font-bold transition-colors z-10" title="削除">
                    ×
                  </button>
                  <div className="flex items-center gap-1.5 mb-2 pr-10 select-none">
                    <div className="flex flex-col lg:hidden mr-1">
                      <button onClick={() => moveInsurance(index, 'up')} disabled={index === 0} className="text-[12px] text-gray-500 disabled:opacity-20 leading-none p-1">▲</button>
                      <button onClick={() => moveInsurance(index, 'down')} disabled={index === insurances.length - 1} className="text-[12px] text-gray-500 disabled:opacity-20 leading-none p-1">▼</button>
                    </div>
                    <span className="text-sm font-bold text-gray-400 hidden lg:inline">☰</span>
                    <span className="text-sm font-bold text-gray-700">{numLabel}</span>
                    <span className="font-bold text-sm truncate max-w-[120px]">{ins.company}</span>
                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 truncate">{ins.insuranceType}</span>
                  </div>
                  <div>
                    <textarea value={ins.coverageText} onChange={e => updateCoverageText(ins.id, e.target.value)} placeholder="保障内容を編集できます" className="w-full border rounded p-2 text-sm h-16 resize-none focus:border-blue-500 focus:outline-none" />
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