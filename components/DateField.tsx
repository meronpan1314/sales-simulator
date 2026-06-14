type DateParts = {
  year: number;
  month: number;
  day: number;
};

export type DateFieldKey = 'createdDate' | 'birthday';

type Props = {
  field: DateFieldKey;
  label: string;
  value: string;
  yearStart: number;
  yearEnd: number;
  placeholder: string;
  isOpen: boolean;
  showTodayButton?: boolean;
  onChange: (field: DateFieldKey, value: string) => void;
  onToggle: (field: DateFieldKey) => void;
  onClose: () => void;
};

const fieldClass = 'relative';
const labelClass = 'mb-1 block text-sm font-bold text-gray-600';
const triggerClass = 'flex w-full items-center justify-between rounded border bg-white p-3 text-left text-base font-semibold text-gray-900 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none';
const popoverClass = 'absolute left-0 right-0 top-full z-30 mt-2 rounded border border-gray-300 bg-white p-3 shadow-xl';
const selectClass = 'min-w-0 rounded border bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none';
const dayBaseClass = 'flex aspect-square min-h-9 items-center justify-center rounded border text-sm font-semibold transition-colors focus:border-blue-500 focus:outline-none';
const dayDefaultClass = 'border-gray-200 bg-gray-50 text-gray-800 hover:border-blue-400 hover:bg-blue-50';
const daySelectedClass = 'border-blue-700 bg-blue-600 text-white hover:bg-blue-700';
const actionClass = 'rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 hover:bg-blue-100';

const parseDateValue = (value: string): DateParts | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return { year, month, day };
};

const toDateValue = ({ year, month, day }: DateParts) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
const clampDay = (year: number, month: number, day: number) => Math.min(day, getDaysInMonth(year, month));

export const getTodayParts = (): DateParts => {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
};

const formatDateLabel = (value: string) => {
  const parts = parseDateValue(value);
  if (!parts) return '日付を選択';
  return `${parts.year}年${parts.month}月${parts.day}日`;
};

const getJapaneseYearLabel = (year: number) => {
  const japaneseYear = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
    era: 'long',
    year: 'numeric',
  }).format(new Date(year, 0, 1));

  return `${year}年（${japaneseYear}）`;
};

export default function DateField({
  field,
  label,
  value,
  yearStart,
  yearEnd,
  placeholder,
  isOpen,
  showTodayButton = false,
  onChange,
  onToggle,
  onClose,
}: Props) {
  const selected = parseDateValue(value);
  const fallback = selected ?? (field === 'birthday' ? { year: 1980, month: 1, day: 1 } : getTodayParts());
  const viewYear = fallback.year;
  const viewMonth = fallback.month;
  const viewDay = fallback.day;
  const years = Array.from({ length: yearEnd - yearStart + 1 }, (_, index) => yearEnd - index);
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const monthStartWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const dayCells = [
    ...Array.from({ length: monthStartWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const changeDatePart = (nextParts: Partial<DateParts>) => {
    const nextYear = nextParts.year ?? viewYear;
    const nextMonth = nextParts.month ?? viewMonth;
    const nextDay = clampDay(nextYear, nextMonth, nextParts.day ?? viewDay);
    onChange(field, toDateValue({ year: nextYear, month: nextMonth, day: nextDay }));
  };

  return (
    <div className={fieldClass}>
      <label className={labelClass}>{label}</label>
      <button
        type="button"
        onClick={() => onToggle(field)}
        className={`${triggerClass} ${value ? '' : 'font-normal text-gray-400'}`}
        aria-expanded={isOpen}
      >
        <span>{value ? formatDateLabel(value) : placeholder}</span>
        <span className="shrink-0 pl-3 text-sm font-bold text-gray-500">▾</span>
      </button>
      {isOpen && (
        <div className={popoverClass}>
          <div className="grid gap-2 [grid-template-columns:minmax(0,1fr)_96px]">
            <select
              value={viewYear}
              onChange={e => changeDatePart({ year: Number(e.target.value) })}
              className={`${selectClass} w-full`}
            >
              {years.map(year => (
                <option key={year} value={year}>{getJapaneseYearLabel(year)}</option>
              ))}
            </select>
            <select
              value={viewMonth}
              onChange={e => changeDatePart({ month: Number(e.target.value) })}
              className={selectClass}
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map(month => (
                <option key={month} value={month}>{month}月</option>
              ))}
            </select>
          </div>
          <div className="mt-3 grid grid-cols-7 text-center text-xs font-bold text-gray-600">
            {['日', '月', '火', '水', '木', '金', '土'].map(dayName => (
              <span key={dayName} className="py-1">{dayName}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dayCells.map((day, index) => (
              day === null ? (
                <span key={`empty-${index}`} className="flex aspect-square min-h-9 items-center justify-center rounded border border-transparent text-sm" />
              ) : (
                <button
                  type="button"
                  key={day}
                  onClick={() => {
                    changeDatePart({ day });
                    onClose();
                  }}
                  className={`${dayBaseClass} ${selected?.year === viewYear && selected.month === viewMonth && selected.day === day ? daySelectedClass : dayDefaultClass}`}
                >
                  {day}
                </button>
              )
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2 border-t pt-3">
            {showTodayButton && (
              <button
                type="button"
                onClick={() => {
                  onChange(field, toDateValue(getTodayParts()));
                  onClose();
                }}
                className={actionClass}
              >
                今日
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange(field, '')}
              className={`${actionClass} border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100`}
            >
              クリア
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
