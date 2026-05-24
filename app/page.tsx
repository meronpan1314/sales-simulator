'use client';

import { useState } from 'react';

export default function SalesSimulator() {
  // --- 状態管理（State） ---
  // 入力画面の表示・非表示
  const [showInput, setShowInput] = useState(true);
  // 図形の種類（四角 or 円）
  const [shape, setShape] = useState<'box' | 'circle'>('box');
  // 図形のサイズ
  const [size, setSize] = useState<number>(200);
  // 図形の色
  const [color, setColor] = useState<string>('#3b82f6'); // デフォルトは青
  // 見積もり金額などのテキスト情報
  const [price, setPrice] = useState<number>(50000);

  return (
    <div className="flex h-screen w-full bg-gray-50 font-sans">
      
      {/* ==============================
          INPUTエリア（左側）
          ============================== */}
      {showInput && (
        <div className="w-80 bg-white shadow-lg p-6 flex flex-col gap-6 overflow-y-auto transition-all">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">設定パネル</h2>
            <button 
              onClick={() => setShowInput(false)}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              隠す ◀
            </button>
          </div>

          {/* 図形選択 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">図形のタイプ</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="shape" 
                  checked={shape === 'box'} 
                  onChange={() => setShape('box')} 
                /> 四角形
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="shape" 
                  checked={shape === 'circle'} 
                  onChange={() => setShape('circle')} 
                /> 円形
              </label>
            </div>
          </div>

          {/* サイズ変更 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">サイズ: {size}px</label>
            <input 
              type="range" 
              min="100" 
              max="400" 
              value={size} 
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 色変更 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">カラー</label>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 cursor-pointer"
            />
          </div>

          {/* 金額入力 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">概算費用 (円)</label>
            <input 
              type="number" 
              value={price} 
              onChange={(e) => setPrice(Number(e.target.value))}
              className="border border-gray-300 rounded p-2 w-full"
            />
          </div>
        </div>
      )}

      {/* ==============================
          OUTPUTエリア（右側・お客様に見せる画面）
          ============================== */}
      <div className="flex-1 flex flex-col relative bg-gray-50">
        
        {/* INPUTが隠れている時に再表示するボタン */}
        {!showInput && (
          <button 
            onClick={() => setShowInput(true)}
            className="absolute top-6 left-6 bg-white shadow-md rounded px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all z-10"
          >
            ▶ 設定を開く
          </button>
        )}

        {/* プレゼンテーション領域 */}
        <div className="flex-1 flex flex-col items-center justify-center p-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-12">
            シミュレーション結果
          </h1>

          {/* 図形の描画 (SVGを利用) */}
          <div className="mb-12 flex justify-center items-center h-[400px] w-[400px] bg-white rounded-xl shadow-inner border border-gray-200">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {shape === 'box' ? (
                <rect 
                  width={size} 
                  height={size} 
                  fill={color} 
                  rx="8" // 少し角丸に
                  className="transition-all duration-300"
                />
              ) : (
                <circle 
                  cx={size / 2} 
                  cy={size / 2} 
                  r={size / 2} 
                  fill={color} 
                  className="transition-all duration-300"
                />
              )}
            </svg>
          </div>

          {/* 情報の一覧表示 */}
          <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md text-center">
            <p className="text-gray-500 text-sm mb-2">想定されるお見積もり</p>
            <p className="text-4xl font-extrabold text-gray-800">
              ¥{price.toLocaleString()} <span className="text-lg font-normal text-gray-600">/ 月</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}