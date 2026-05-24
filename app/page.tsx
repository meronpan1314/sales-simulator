'use client';

import { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

import { 
  Insurance, 
  COMPANY_MASTER, 
  INSURANCE_TYPES, 
  DEFAULT_COLOR, 
  CIRCLED_NUMBERS 
} from '../constants/insurance'; 

const initialInsurances: Insurance[] = [];

export default function Home() {
  /* =========================
      顧客情報
  ========================= */
  const [documentType, setDocumentType] = useState('ご提案内容');
  const [createdDate, setCreatedDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [birthday, setBirthday] = useState('');

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setCreatedDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  /* =========================
      保険情報
  ========================= */
  const [showForm, setShowForm] = useState(true);
  const [insurances, setInsurances] = useState<Insurance[]>(initialInsurances);
  const [company, setCompany] = useState('');
  const [insuranceType, setInsuranceType] = useState('');
  const [coverageText, setCoverageText] = useState('');
  const [paymentEndAge, setPaymentEndAge] = useState(65);
  const [monthlyFee, setMonthlyFee] = useState(5000);
  const [shapeType, setShapeType] = useState<'term' | 'triangle' | 'lifetime'>('term');

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  /* =========================
      年齢・日付計算ツール
  ========================= */
  const calculateAge = (birthday: string) => {
    if (!birthday) return '';
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  const currentAge = calculateAge(birthday);

  const toJapaneseCalendar = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
      era: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatCreatedDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
  };

  /* =========================
      SVG設定
  ========================= */
  const width = 600; 
  
  const ageToX = (age: number) => {
    if (!currentAge) return 0;
    const maxAge = 90; 
    const mapped = ((age - Number(currentAge)) / (maxAge - Number(currentAge))) * width;
    return Math.max(0, Math.min(mapped, width));
  };

  /* =========================
      保険の追加・削除・編集アクション
  ========================= */
  const addInsurance = () => {
    if (!company) return alert('保険会社を入力してください');
    const master = COMPANY_MASTER[company] || { color: DEFAULT_COLOR, logo: '' };

    const newInsurance: Insurance = {
      id: Date.now(),
      company,
      insuranceType,
      coverageText,
      paymentEndAge,
      monthlyFee,
      shapeType,
      color: master.color,
      logo: master.logo,
    };
    
    setInsurances([newInsurance, ...insurances]);
    setCompany('');
    setInsuranceType('');
    setCoverageText('');
    setPaymentEndAge(65);
    setMonthlyFee(5000);
    setShapeType('term');
  };

  const removeInsurance = (id: number) => {
    setInsurances(insurances.filter(ins => ins.id !== id));
  };

  const updateCoverageText = (id: number, text: string) => {
    setInsurances(
      insurances.map(ins => ins.id === id ? { ...ins, coverageText: text } : ins)
    );
  };

  /* =========================
      ドラッグ＆ドロップ用イベントハンドラ
  ========================= */
  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newInsurances = [...insurances];
    const draggedItem = newInsurances[draggedIndex];
    newInsurances.splice(draggedIndex, 1);
    newInsurances.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setInsurances(newInsurances);
  };

  const handleDragEnd = () => setDraggedIndex(null);

  /* =========================
      PDF出力ロジック
  ========================= */
  const handleDownloadPDF = async () => {
    const targetElement = document.getElementById('pdf-export-area');
    if (!targetElement) return;

    setIsGeneratingPDF(true);

    try {
      const imgData = await toPng(targetElement, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      
      let finalWidth = pdfWidth;
      let finalHeight = finalWidth / ratio;

      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = finalHeight * ratio;
      }

      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      
      const fileName = `${customerName || 'お客'}様_${documentType}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF生成に失敗しました', error);
      alert('PDFの出力に失敗しました。');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const totalPrice = insurances.reduce((sum, insurance) => sum + insurance.monthlyFee, 0);

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-100 text-gray-900 font-sans">
      
      {/* ========================================================
          FORM (左側パネル / スマホ時は上部パネル)
      ======================================================== */}
      {showForm && (
        <div className="w-full lg:w-[460px] h-auto lg:h-full overflow-y-auto border-b lg:border-r bg-white p-4 lg:p-6 shadow-xl shrink-0 z-20 relative flex flex-col gap-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl lg:text-2xl font-bold">設定パネル</h2>
            <button
              onClick={() => setShowForm(false)}
              className="rounded bg-gray-200 px-3 py-1 text-sm font-semibold hover:bg-gray-300"
            >
              閉じる ◀
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800 font-bold mb-3">資料が完成したら出力</p>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className={`w-full py-3 rounded text-white font-bold shadow-md transition-all ${
                isGeneratingPDF ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isGeneratingPDF ? 'PDFを生成中...' : '📥 PDFをダウンロード'}
            </button>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4 lg:p-5">
            <h3 className="mb-4 text-lg font-bold border-b pb-2">顧客情報</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-600">内容</label>
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="w-full rounded border p-3 text-base">
                  <option>ご契約内容</option>
                  <option>ご提案内容</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-600">作成日</label>
                <input type="date" value={createdDate} onChange={(e) => setCreatedDate(e.target.value)} className="w-full rounded border p-3 text-base" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-600">氏名</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded border p-3 text-base" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-600">生年月日</label>
                <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full rounded border p-3 text-base" />
              </div>
              <div className="rounded bg-blue-100 p-3 text-center flex flex-col items-center">
                {birthday && <span className="text-sm text-gray-600 font-bold mb-1">{toJapaneseCalendar(birthday)}</span>}
                <div>
                  <span className="text-sm text-gray-600 mr-2">現在の年齢:</span>
                  <span className="text-2xl font-bold text-blue-800">{currentAge || '--'} 歳</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4 lg:p-5">
            <h3 className="mb-4 text-lg font-bold border-b pb-2">保険の新規追加</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-600">保険会社</label>
                <input list="company-options" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="選択または直接入力" className="w-full rounded border p-3 text-base" />
                <datalist id="company-options">
                  {Object.keys(COMPANY_MASTER).map((name) => <option key={name} value={name} />)}
                </datalist>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-600">保険種類</label>
                <input list="type-options" value={insuranceType} onChange={(e) => setInsuranceType(e.target.value)} placeholder="選択または直接入力" className="w-full rounded border p-3 text-base" />
                <datalist id="type-options">
                  {INSURANCE_TYPES.map((type) => <option key={type} value={type} />)}
                </datalist>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-600">保険金額・保障内容など</label>
                <textarea value={coverageText} onChange={(e) => setCoverageText(e.target.value)} placeholder="・日額5,000円&#13;&#10;・手術2.5万円" className="h-24 w-full rounded border p-3 text-base" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-600">払込期間 (年齢)</label>
                <input type="number" value={paymentEndAge} onChange={(e) => setPaymentEndAge(Number(e.target.value))} className="w-full rounded border p-3 text-base" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-600">月額保険料 (円)</label>
                <input type="number" value={monthlyFee} onChange={(e) => setMonthlyFee(Number(e.target.value))} className="w-full rounded border p-3 text-base" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-600">図形の種類</label>
                <select value={shapeType} onChange={(e) => setShapeType(e.target.value as 'term' | 'triangle' | 'lifetime')} className="w-full rounded border p-3 text-base">
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
                    <div
                      key={ins.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 bg-white border rounded shadow-sm relative group cursor-move transition-all ${
                        draggedIndex === index ? 'opacity-30 border-blue-400 bg-blue-50' : 'hover:border-gray-400'
                      }`}
                    >
                      <button
                        onClick={() => removeInsurance(ins.id)}
                        className="absolute top-2 right-2 flex lg:hidden group-hover:flex items-center justify-center w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-xs font-bold transition-colors"
                        title="削除"
                      >
                        ×
                      </button>
                      <div className="flex items-center gap-1.5 mb-2 pr-8 select-none">
                        <span className="text-sm font-bold text-gray-400">☰</span>
                        <span className="text-sm font-bold text-gray-700">{numLabel}</span>
                        <span className="font-bold text-sm truncate max-w-[120px]">{ins.company}</span>
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 truncate">{ins.insuranceType}</span>
                      </div>
                      <div>
                        <textarea
                          value={ins.coverageText}
                          onChange={(e) => updateCoverageText(ins.id, e.target.value)}
                          placeholder="保障内容を編集できます"
                          className="w-full border rounded p-2 text-sm h-16 resize-none focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-gray-400 text-center pt-1">※カードを上下にドラッグして並び替えができます</p>
                <p className="text-[10px] text-red-400 text-center">※スマホブラウザではドラッグがうまく動作しない場合があります</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================
          OUTPUT (右側・スマホ時は下部：お客様に見せる画面)
      ======================================================== */}
      <div className="flex-1 overflow-auto p-4 lg:p-10 bg-gray-200 flex flex-col items-center">
        
        <div className="w-full max-w-[1000px] flex justify-start">
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="mb-4 rounded bg-white px-4 py-2 shadow font-bold text-sm hover:bg-gray-50">
              ▶ 設定パネルを開く
            </button>
          )}
        </div>

        <div className="w-full max-w-[1000px] overflow-x-auto pb-8">
          <div 
            id="pdf-export-area" 
            className="w-[1000px] min-w-[1000px] min-h-[700px] bg-white p-12 shadow-md border border-gray-300 relative mx-auto"
          >
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-xl tracking-widest font-bold mb-4">{documentType}</p>
                <h1 className="text-3xl font-bold border-b-2 border-black pb-2 inline-block min-w-[300px]">
                  {customerName || '     '} 様 
                  <span className="text-xl ml-2 font-normal">
                    〈 {toJapaneseCalendar(birthday)}{birthday ? ' ' : ''}{currentAge || '〇'}歳 〉
                  </span>
                </h1>
                <p className="text-sm mt-2">{formatCreatedDate(createdDate)} 作成</p>
              </div>
              <div className="w-[300px] text-sm">
                <p className="border-b border-black pb-1 mb-2 font-bold">保険料内訳</p>
                <div className="space-y-1">
                  {insurances.map((ins, index) => {
                    const reversedNumberIndex = insurances.length - 1 - index;
                    const numLabel = CIRCLED_NUMBERS[reversedNumberIndex] || '';

                    return (
                      <div key={ins.id} className="flex justify-between">
                        <span className="truncate pr-2">{numLabel}{ins.company} {ins.insuranceType}・・・・</span>
                        <span className="whitespace-nowrap">{ins.monthlyFee.toLocaleString()}円</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-black border-dashed mt-2 pt-2 flex justify-end font-bold text-xl">
                  {totalPrice.toLocaleString()}円
                </div>
              </div>
            </div>

            <div className="relative mt-8">
              {insurances.map((insurance, index) => {
                const startX = 0;
                const endX = ageToX(insurance.paymentEndAge);
                const shapeH = 100;

                const isDefault = insurance.color === DEFAULT_COLOR;
                const fillOpacity = isDefault ? "1" : "0.12";
                const strokeColor = isDefault ? "#a4c2f4" : insurance.color;

                const reversedNumberIndex = insurances.length - 1 - index;
                const numLabel = CIRCLED_NUMBERS[reversedNumberIndex] || '';

                const linesCount = insurance.coverageText ? insurance.coverageText.split('\n').length : 1;
                let textStyleClass = '';
                if (linesCount === 1) textStyleClass = 'text-lg font-bold'; 
                else if (linesCount === 2) textStyleClass = 'text-base font-bold leading-snug';
                else if (linesCount === 3) textStyleClass = 'text-sm font-bold leading-tight';
                else textStyleClass = 'text-xs font-bold leading-tight';

                const isTriangle = insurance.shapeType === 'triangle';
                const positionClass = isTriangle ? 'bottom-3 left-5' : 'top-1/2 -translate-y-1/2 left-5';
                
                let maxTextWidth;
                if (insurance.shapeType === 'lifetime') {
                  maxTextWidth = width - 30;
                } else if (isTriangle) {
                  maxTextWidth = Math.max(80, endX * 0.65); 
                } else {
                  maxTextWidth = Math.max(80, endX - 20);
                }

                return (
                  <div key={insurance.id} className="flex h-[100px] mb-0 relative">
                    <div className="w-[280px] shrink-0 border-b border-gray-300 flex items-center gap-3 px-2 h-[100px]">
                      <span className="text-base font-bold shrink-0">{numLabel}</span>
                      <div className="flex flex-col justify-center min-w-0">
                        {insurance.logo && (
                          <img src={insurance.logo} alt={insurance.company} className="h-7 object-contain object-left mb-1" />
                        )}
                        <h2 className="text-base font-bold leading-tight truncate">{insurance.company}</h2>
                        <p className="text-xs text-gray-500 truncate">{insurance.insuranceType}</p>
                      </div>
                    </div>

                    <div className="flex-1 relative h-[100px]">
                      <div 
                        className={`absolute z-10 whitespace-pre-wrap break-all pointer-events-none text-gray-800 ${positionClass} ${textStyleClass}`}
                        style={{ maxWidth: maxTextWidth, textShadow: '0px 0px 4px rgba(255,255,255,0.8)' }}
                      >
                        {insurance.coverageText}
                      </div>

                      <svg width={width + 50} height={shapeH} className="overflow-visible block">
                        {insurance.shapeType === 'term' && (
                          <rect x={startX} y={0} width={endX} height={shapeH} stroke={strokeColor} strokeWidth="2" fill={insurance.color} fillOpacity={fillOpacity} />
                        )}
                        {insurance.shapeType === 'triangle' && (
                          <polygon points={`${startX},0 ${startX},${shapeH} ${endX},${shapeH}`} stroke={strokeColor} strokeWidth="2" fill={insurance.color} fillOpacity={fillOpacity} />
                        )}
                        {insurance.shapeType === 'lifetime' && (
                          <polygon points={`${startX},0 ${width},0 ${width + 25},${shapeH / 2} ${width},${shapeH} ${startX},${shapeH}`} stroke={strokeColor} strokeWidth="2" fill={insurance.color} fillOpacity={fillOpacity} />
                        )}
                      </svg>
                    </div>
                  </div>
                );
              })}

              <div className="flex border-t-2 border-black relative">
                <div className="w-[280px] shrink-0" />
                <div className="flex-1 relative h-8 text-sm pt-1">
                  <div className="absolute top-1 transform -translate-x-1/2" style={{ left: 0 }}>{currentAge || '--'}歳</div>
                  {[...new Set(insurances.filter(ins => ins.shapeType !== 'lifetime').map(ins => ins.paymentEndAge))].map(age => (
                    <div key={age} className="absolute top-1 transform -translate-x-1/2" style={{ left: ageToX(age) }}>{age}歳</div>
                  ))}
                  {insurances.some(ins => ins.shapeType === 'lifetime') && (
                    <div className="absolute top-1 whitespace-nowrap" style={{ left: width + 10 }}>一生涯</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}