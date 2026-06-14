import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

// 1. 年齢計算
export const calculateAge = (birthday: string) => {
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

export const resolveReferenceAge = (birthday: string, referenceAge: string) => {
  const currentAge = calculateAge(birthday);
  const trimmedAge = referenceAge.trim();

  if (!trimmedAge) return currentAge;

  const selectedAge = Number(trimmedAge);
  if (!Number.isFinite(selectedAge) || !Number.isInteger(selectedAge) || selectedAge < 0) {
    return currentAge;
  }

  return selectedAge;
};

// 2. 和暦変換
export const toJapaneseCalendar = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
    era: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).format(date);
};

// 3. 日付フォーマット
export const formatCreatedDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
};

// 4. PDF出力ロジック
export const downloadPDF = async (elementId: string, fileName: string, setIsGenerating: (val: boolean) => void) => {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) return;

  setIsGenerating(true);
  try {
    const imgData = await toPng(targetElement, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      style: { transform: 'scale(1)', transformOrigin: 'top left' }
    });

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
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
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF生成に失敗しました', error);
    alert('PDFの出力に失敗しました。');
  } finally {
    setIsGenerating(false);
  }
};
