'use client';

export default function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg">💡 提案シミュレーターの使い方</h3>
          <button onClick={onClose} className="text-3xl leading-none hover:text-gray-300">&times;</button>
        </div>
        
        <div className="p-6 space-y-6 text-sm overflow-y-auto max-h-[75vh]">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 text-lg">1</div>
            <div>
              <p className="font-bold text-base mb-1">保険の追加</p>
              <p className="text-gray-600 leading-relaxed">設定パネルから情報を入力して「追加」を押すと、一番上（新しい順）に追加されます。</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 text-lg">2</div>
            <div>
              <p className="font-bold text-base mb-1">順番を変える・削除する</p>
              <p className="text-gray-600 leading-relaxed">
                <span className="font-semibold">【PC】</span>カードを上下にドラッグ<br/>
                <span className="font-semibold">【スマホ】</span>カード内の「▲▼」ボタンをタップ<br/>
                ※右上の「×」ボタンから削除も可能です。
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 text-lg">3</div>
            <div>
              <p className="font-bold text-base mb-1">保障内容を編集する</p>
              <p className="text-gray-600 leading-relaxed">登録済みカードのテキストエリアを書き換えると、図形上の文字もリアルタイムに変わります。</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 text-lg">4</div>
            <div>
              <p className="font-bold text-base mb-1">PDFで出力する</p>
              <p className="text-gray-600 leading-relaxed">「PDFをダウンロード」を押すと、そのまま渡せるA4横サイズの資料が生成されます。</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <button onClick={onClose} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}