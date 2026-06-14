'use client';

import { useState, useEffect } from 'react';
import { Insurance } from '../constants/insurance';
import { downloadPDF } from '../utils/helpers';
import HelpModal from '../components/HelpModal';
import SidebarForm from '../components/SidebarForm';
import PreviewArea from '../components/PreviewArea';

const getTodayDateValue = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function Home() {
  const [customerInfo, setCustomerInfo] = useState({
    documentType: 'ご提案内容',
    createdDate: getTodayDateValue(),
    customerName: '',
    birthday: ''
  });
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  
  const [showForm, setShowForm] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    document.title = '保険提案シミュレーター';
  }, []);

  const handleDownloadPDF = () => {
    const fileName = `${customerInfo.customerName || 'お客'}様_${customerInfo.documentType}.pdf`;
    downloadPDF('pdf-export-area', fileName, setIsGeneratingPDF);
  };

  return (
    <div className="app-shell">
      
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

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
