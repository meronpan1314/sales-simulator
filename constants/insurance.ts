// 型定義
export type Insurance = {
  id: number;
  company: string;
  insuranceType: string;
  coverageText: string;
  coverageTextSizes?: number[];
  paymentEndAge: number | '';
  monthlyFee: number;
  shapeType: 'term' | 'triangle' | 'lifetime';
  color: string;
  logo: string;
};

// 保険会社のマスタデータ
export const COMPANY_MASTER: Record<string, { color: string; logo: string }> = {
  'オリックス生命': { color: '#9fc5e8', logo: '/images/logos/ins_icon_00.png' },
  'ソニー生命': { color: '#b6d7a8', logo: '/images/logos/ins_icon_07.png' },
  'あんしん生命': { color: '#a2c4c9', logo: '/images/logos/ins_icon_02.jpg' },
  'FWD生命': { color: '#f6b26b', logo: '/images/logos/ins_icon_18.png' },
  'チューリッヒ生命': { color: '#cfe2f3', logo: '/images/logos/ins_icon_08.png' },
  'メディケア生命': { color: '#ffd966', logo: '/images/logos/ins_icon_17.png' },
  '第一ネオ生命': { color: '#6fa8dc', logo: '/images/logos/ins_icon_16.png' },
  'なないろ生命': { color: '#fff2cc', logo: '/images/logos/ins_icon_12.png' },
  'はなさく生命': { color: '#ea9999', logo: '/images/logos/ins_icon_13.png' },
  'ひまわり生命': { color: '#ffd966', logo: '/images/logos/ins_icon_05.png' },
  'あいおい生命': { color: '#93c47d', logo: '/images/logos/ins_icon_14.png' },
  'ジブラルタ生命': { color: '#6d9eeb', logo: '/images/logos/ins_icon_15.png' },
  'PGF生命': { color: '#6d9eeb', logo: '/images/logos/ins_icon_09.png' },
  'エヌエヌ生命': { color: '#f1c232', logo: '/images/logos/ins_icon_11.png' },
  '日本生命': { color: '#ea9999', logo: '/images/logos/ins_icon_10.png' },
  '明治安田生命': { color: '#93c47d', logo: '/images/logos/ins_icon_01.jpg' },
  'マニュライフ生命': { color: '#b6d7a8', logo: '/images/logos/ins_icon_04.png' },
  '住友生命': { color: '#f4cccc', logo: '/images/logos/ins_icon_06.png' },
  'アクサ生命': { color: '#b4a7d6', logo: '/images/logos/ins_icon_03.png' },
};

// 保険種類のプルダウン選択肢
export const INSURANCE_TYPES = [
  '終身保険',
  '終身保険(変額)',
  '収入保障保険',
  '医療保険',
  '定期保険',
  '養老保険',
  '変額保険(有期型)',
  'がん保険',
  '三大疾病一時金',
  '年金保険',
  '介護保険'
];

// その他の共通定数
export const DEFAULT_COLOR = '#cfe2f3';
export const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
