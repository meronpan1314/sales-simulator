'use client';

import { Insurance, DEFAULT_COLOR, CIRCLED_NUMBERS } from '../constants/insurance';
import { calculateAge, toJapaneseCalendar, formatCreatedDate } from '../utils/helpers';

// SidebarFormと同じ型を再定義して依存エラーを完全に防ぎます
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

export default function PreviewArea({ showForm, onOpenForm, onOpenHelp, customerInfo, insurances }: Props) {
  const currentAge = calculateAge(customerInfo.birthday);
  const totalPrice = insurances.reduce((sum, ins) => sum + ins.monthlyFee, 0);
  const width = 600; 

  const ageToX = (age: number) => {
    if (!currentAge) return 0;
    const mapped = ((age - Number(currentAge)) / (90 - Number(currentAge))) * width;
    return Math.max(0, Math.min(mapped, width));
  };

  return (
    <div className="flex-1 w-full lg:h-full lg:overflow-auto p-4 lg:p-10 bg-gray-200 flex flex-col items-center">
      
      {/* ボタン群 */}
      <div className="w-full max-w-[1000px] flex justify-start items-center gap-3">
        {!showForm && (
          <button onClick={onOpenForm} className="mb-4 rounded bg-white px-4 py-2 shadow font-bold text-sm hover:bg-gray-50">
            ▶ 設定パネルを開く
          </button>
        )}
        <button 
          onClick={onOpenHelp} 
          className="mb-4 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-gray-500 hover:text-blue-600 font-bold text-lg"
        >
          ?
        </button>
      </div>

      <div className="w-full max-w-full overflow-x-auto pb-8">
        <div id="pdf-export-area" className="w-[1000px] min-w-[1000px] min-h-[700px] bg-white p-12 shadow-md border border-gray-300 relative mx-auto">
          
          {/* ヘッダー部分 */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-xl tracking-widest font-bold mb-4">{customerInfo.documentType}</p>
              <h1 className="text-3xl font-bold border-b-2 border-black pb-2 inline-block min-w-[300px]">
                {customerInfo.customerName || '     '} 様 
                <span className="text-xl ml-2 font-normal">
                  〈 {toJapaneseCalendar(customerInfo.birthday)}{customerInfo.birthday ? ' ' : ''}{currentAge || '〇'}歳 〉
                </span>
              </h1>
              <p className="text-sm mt-2">{formatCreatedDate(customerInfo.createdDate)} 作成</p>
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

          {/* 図形エリア */}
          <div className="relative mt-8">
            {insurances.map((ins, index) => {
              const startX = 0; 
              const endX = ageToX(ins.paymentEndAge); 
              const shapeH = 100;
              const isDefault = ins.color === DEFAULT_COLOR;
              const fillOpacity = isDefault ? "1" : "0.12";
              const strokeColor = isDefault ? "#a4c2f4" : ins.color;
              
              const reversedNumberIndex = insurances.length - 1 - index;
              const numLabel = CIRCLED_NUMBERS[reversedNumberIndex] || '';

              const linesCount = ins.coverageText ? ins.coverageText.split('\n').length : 1;
              let textStyleClass = 'text-xs font-bold leading-tight';
              if (linesCount === 1) textStyleClass = 'text-lg font-bold'; 
              else if (linesCount === 2) textStyleClass = 'text-base font-bold leading-snug';
              else if (linesCount === 3) textStyleClass = 'text-sm font-bold leading-tight';
              
              const isTriangle = ins.shapeType === 'triangle';
              const positionClass = isTriangle ? 'bottom-3 left-5' : 'top-1/2 -translate-y-1/2 left-5';
              
              let maxTextWidth = Math.max(80, endX - 20);
              if (ins.shapeType === 'lifetime') {
                maxTextWidth = width - 30;
              } else if (isTriangle) {
                maxTextWidth = Math.max(80, endX * 0.65); 
              }

              return (
                <div key={ins.id} className="flex h-[100px] mb-0 relative">
                  <div className="w-[280px] shrink-0 border-b border-gray-300 flex items-center gap-3 px-2 h-[100px]">
                    <span className="text-base font-bold shrink-0">{numLabel}</span>
                    <div className="flex flex-col justify-center min-w-0">
                      {ins.logo && (
                        <img src={ins.logo} alt={ins.company} className="h-7 object-contain object-left mb-1" />
                      )}
                      <h2 className="text-base font-bold leading-tight truncate">{ins.company}</h2>
                      <p className="text-xs text-gray-500 truncate">{ins.insuranceType}</p>
                    </div>
                  </div>

                  <div className="flex-1 relative h-[100px]">
                    <div 
                      className={`absolute z-10 whitespace-pre-wrap break-all pointer-events-none text-gray-800 ${positionClass} ${textStyleClass}`} 
                      style={{ maxWidth: maxTextWidth, textShadow: '0px 0px 4px rgba(255,255,255,0.8)' }}
                    >
                      {ins.coverageText}
                    </div>

                    <svg width={width + 50} height={shapeH} className="overflow-visible block">
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
            <div className="flex border-t-2 border-black relative">
              <div className="w-[280px] shrink-0" />
              <div className="flex-1 relative h-8 text-sm pt-1">
                <div className="absolute top-1 transform -translate-x-1/2" style={{ left: 0 }}>
                  {currentAge || '--'}歳
                </div>
                {Array.from(new Set(insurances.filter(ins => ins.shapeType !== 'lifetime').map(ins => ins.paymentEndAge))).map(age => (
                  <div key={age} className="absolute top-1 transform -translate-x-1/2" style={{ left: ageToX(age) }}>
                    {age}歳
                  </div>
                ))}
                {insurances.some(ins => ins.shapeType === 'lifetime') && (
                  <div className="absolute top-1 whitespace-nowrap" style={{ left: width + 10 }}>
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