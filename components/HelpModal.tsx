'use client';

export default function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
    >
      <div 
        className="help-modal" 
        onClick={e => e.stopPropagation()}
      >
        <div className="help-modal-header">
          <h3 className="help-modal-title">💡 提案シミュレーターの使い方</h3>
          <button onClick={onClose} className="help-modal-close">&times;</button>
        </div>
        
        <div className="help-modal-body">
          <div className="help-step">
            <div className="help-step-number">1</div>
            <div>
              <p className="help-step-title">保険の追加</p>
              <p className="help-step-text">設定パネルから情報を入力して「追加」を押すと、一番上（新しい順）に追加されます。</p>
            </div>
          </div>
          <div className="help-step">
            <div className="help-step-number">2</div>
            <div>
              <p className="help-step-title">順番を変える・削除する</p>
              <p className="help-step-text">
                <span className="help-step-emphasis">【PC】</span>カードを上下にドラッグ<br/>
                <span className="help-step-emphasis">【スマホ】</span>カード内の「▲▼」ボタンをタップ<br/>
                ※右上の「×」ボタンから削除も可能です。
              </p>
            </div>
          </div>
          <div className="help-step">
            <div className="help-step-number">3</div>
            <div>
              <p className="help-step-title">保障内容を編集する</p>
              <p className="help-step-text">登録済みカードのテキストエリアを書き換えると、図形上の文字もリアルタイムに変わります。</p>
            </div>
          </div>
          <div className="help-step">
            <div className="help-step-number">4</div>
            <div>
              <p className="help-step-title">PDFで出力する</p>
              <p className="help-step-text">「PDFをダウンロード」を押すと、そのまま渡せるA4横サイズの資料が生成されます。</p>
            </div>
          </div>
        </div>
        
        <div className="help-modal-footer">
          <button onClick={onClose} className="btn-modal-close">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
