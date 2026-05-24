'use client';

import { useState, useEffect } from 'react';
import { Insurance } from '../constants/insurance';
import { downloadPDF } from '../utils/helpers';
import HelpModal from '../components/HelpModal';
import SidebarForm from '../components/SidebarForm';
import PreviewArea from '../components/PreviewArea';

export default function Home() {
  // 画面全体で共有するデータ
  const [customerInfo, setCustomerInfo] = useState({
    documentType: 'ご提案内容',
    createdDate: '',
    customerName: '',
    birthday: ''
  });
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  
  // 画面の表示状態（ON/OFF）
  const [showForm, setShowForm] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // 初回読み込み時の設定
  useEffect(() => {
    document.title = '保険提案シミュレーター';
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setCustomerInfo(prev => ({ ...prev, createdDate: `${yyyy}-${mm}-${dd}` }));
  }, []);

  // PDFダウンロードのトリガー
  const handleDownloadPDF = () => {
    const fileName = `${customerInfo.customerName || 'お客'}様_${customerInfo.documentType}.pdf`;
    downloadPDF('pdf-export-area', fileName, setIsGeneratingPDF);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen w-full bg-gray-100 text-gray-900 overflow-x-hidden">
      
      {/* 使い方ガイド */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* 左パネル: 入力フォーム */}
      {showForm && (
        <SidebarForm 
          onClose={() => setShowForm(false)}
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          insurances={insurances}
          setInsurances={setInsurances}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={isGeneratingPDF}
        />
      )}

      {/* 右パネル: 資料ビュー */}
      <PreviewArea 
        showForm={showForm}
        onOpenForm={() => setShowForm(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        customerInfo={customerInfo}
        insurances={insurances}
      />
      
    </div>
  );
}