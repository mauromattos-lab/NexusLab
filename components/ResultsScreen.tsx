import React, { useState } from 'react';
import type { DiagnosisResult, AISolution, DiagnosisData } from '../types';
import { Gauge } from './Gauge';
import { PdfReport } from './PdfReport';
import { APP_CONFIG } from '../config';

declare const jspdf: any;
declare const html2canvas: any;

interface ResultsScreenProps {
  result: DiagnosisResult;
  diagnosisData: DiagnosisData;
  onReset: () => void;
  audioManager: any;
}

const KpiCard: React.FC<{ value: string; label: string; icon: React.ReactNode, color: string }> = ({ value, label, icon, color }) => (
    <div className="glass-pane rounded-xl p-3 flex flex-col justify-between h-full">
        <div>
            <div className={`w-7 h-7 flex items-center justify-center rounded-lg mb-3 text-white ${color}`}>{icon}</div>
            <p className="text-[11px] text-slate-400">{label}</p>
        </div>
        <p className={`text-lg md:text-xl font-bold ${color === 'text-fuchsia-400' ? 'text-glow-secondary' : 'text-glow'}`}>{value}</p>
    </div>
);

const ImpactBadge: React.FC<{ impact: AISolution['impact'] }> = ({ impact }) => {
  const styles = {
    'Alto': 'bg-cyan-400/20 text-cyan-300',
    'Médio': 'bg-yellow-400/20 text-yellow-300',
    'Baixo': 'bg-green-400/20 text-green-300',
  };
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[impact]}`}>
      {impact} Impacto
    </span>
  );
};

const SolutionCard: React.FC<{ solution: AISolution, icon: React.ReactNode }> = ({ solution, icon }) => (
  <div className="glass-pane rounded-2xl p-4 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-cyan-500/10">
    <div className="flex flex-col md:flex-row gap-4">
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-800 text-cyan-400">{icon}</div>
        <div className="flex-grow">
            <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="text-base md:text-lg font-bold text-white pr-4">{solution.title}</h3>
                <div className="flex-shrink-0">
                    <ImpactBadge impact={solution.impact} />
                </div>
            </div>
            <p className="text-slate-400 mb-3 text-sm">{solution.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                <div>
                    <p className="text-slate-500">Tempo de Implementação</p>
                    <p className="font-semibold text-cyan-400">{solution.implementationTime}</p>
                </div>
                 <div>
                    <p className="text-slate-500">ROI Esperado</p>
                    <p className="font-semibold text-fuchsia-400">{solution.expectedROI}</p>
                </div>
            </div>
             <div className="space-y-1.5">
                {solution.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 flex-shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span>{benefit}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  </div>
);


const ICONS = [
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a10 10 0 0 0 10-10h-2a8 8 0 0 1-8 8v2z"/><path d="M2 12h2a8 8 0 0 1 8-8V2a10 10 0 0 0-10 10z"/><path d="m14 12-2-2-2 2 2 2 2-2z"/><path d="M12 6V4"/><path d="M12 20v-2"/><path d="M18 12h2"/><path d="M4 12h2"/></svg>,
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
];

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, diagnosisData, onReset, audioManager }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    audioManager.playSound('submit');
    setIsDownloading(true);
  
    // Use a timeout to ensure the DOM is ready for capture
    setTimeout(() => {
      const reportElement = document.getElementById('pdf-report');
      if (!reportElement) {
        console.error("Report element not found for PDF generation.");
        setIsDownloading(false);
        return;
      }
  
      html2canvas(reportElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: '#010411',
        logging: false,
        width: reportElement.scrollWidth,
        windowWidth: reportElement.scrollWidth,
      }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = jspdf;
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
        });
  
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  
        // Add clickable link
        const buttonElement = reportElement.querySelector<HTMLElement>('#pdf-calendly-button');
        if (buttonElement) {
          const reportRect = reportElement.getBoundingClientRect();
          const buttonRect = buttonElement.getBoundingClientRect();
          
          const scaleX = pdfWidth / reportRect.width;
          const scaleY = pdfHeight / reportRect.height;
  
          const x = (buttonRect.left - reportRect.left) * scaleX;
          const y = (buttonRect.top - reportRect.top) * scaleY;
          const w = buttonRect.width * scaleX;
          const h = buttonRect.height * scaleY;
          
          pdf.link(x, y, w, h, { url: APP_CONFIG.calendlyLink });
        }
  
        pdf.save('diagnostico_nexus_detalhado.pdf');
        setIsDownloading(false);
      }).catch((error: any) => {
        console.error("Error generating PDF with html2canvas:", error);
        setIsDownloading(false);
      });
    }, 100);
  };


  return (
    <>
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, width: '210mm' }}>
          <PdfReport result={result} diagnosisData={diagnosisData} />
      </div>

      <div className="w-full h-full flex flex-col p-2 animate-fade-in-up min-h-0">
        <header className="text-center mb-4 flex-shrink-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-glow">
            DIAGNÓSTICO COMPLETO
          </h2>
          <p className="text-slate-300 text-sm">Análise estratégica de implementação de IA para seu negócio</p>
        </header>
        
        <main className="flex-1 overflow-y-auto pr-2">
          {/* KPI Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-1 glass-pane rounded-2xl p-4 flex flex-col items-center justify-center">
                  <Gauge score={result.potentialTransformationScore} />
                  <p className="mt-3 text-sm font-semibold">Potencial de Transformação IA</p>
              </div>
              <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-2 gap-3">
                  <KpiCard value={result.potentialEconomy} label="Economia Potencial" icon={<>$</>} color="text-green-400" />
                  <KpiCard value={result.timeRecovered} label="Tempo Recuperado" icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} color="text-fuchsia-400" />
                  <KpiCard value={result.productivityGain} label="Ganho de Produtividade" icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} color="text-fuchsia-400" />
                  <KpiCard value={result.implementationTimeframe} label="Tempo de Implementação" icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.89 1.45-1.18 12.8a1 1 0 0 0 .7 1.7l8.47.36 2.74 8.23a1 1 0 0 0 1.7.7l11.35-11.38-9.9-9.9z"/><path d="m11 13 6-6"/></svg>} color="text-cyan-400" />
              </div>
          </div>
          
          {/* Call to Action Section */}
          <div className="mb-6 glass-pane rounded-2xl p-4 text-center">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Transforme Análise em Resultados</h3>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto mb-4">O diagnóstico é o primeiro passo. A consultoria estratégica é a rota mais rápida para transformar estes insights em um plano de implementação personalizado.</p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                  <button onClick={handleDownload} disabled={isDownloading} className="w-full sm:w-auto px-5 py-2.5 border-2 border-cyan-400 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-400 hover:text-slate-900 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      {isDownloading ? 'Gerando Relatório...' : 'Baixar Diagnóstico Detalhado'}
                  </button>
                  <a href={APP_CONFIG.calendlyLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto text-center px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-2 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Agendar Consultoria Estratégica
                  </a>
              </div>
          </div>

          {/* Solutions Section */}
          <div className="space-y-4">
            {result.solutions.map((solution, index) => (
              <SolutionCard key={index} solution={solution} icon={ICONS[index % ICONS.length]} />
            ))}
          </div>
        </main>

         <div className="flex-shrink-0 mt-4 text-center">
             <button onClick={() => { onReset(); audioManager.playSound('transition'); }} className="text-slate-500 hover:text-cyan-300 transition-colors group text-xs">
                Fazer novo diagnóstico <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
            </button>
        </div>
    </div>
  </>);
};