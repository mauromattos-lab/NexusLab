import React from 'react';
import type { DiagnosisResult, DiagnosisData } from '../types';
import { APP_CONFIG } from '../config';
import { OpportunityMap } from './OpportunityMap';
import { MaturityChart } from './MaturityChart';
import { InsightsBlock } from './InsightsBlock';

interface PdfReportProps {
    result: DiagnosisResult;
    diagnosisData: DiagnosisData;
}

export const PdfReport: React.FC<PdfReportProps> = ({ result, diagnosisData }) => {
  const kpis = [
    { label: 'Economia Potencial', value: result.potentialEconomy, color: '#22c55e' },
    { label: 'Tempo Recuperado', value: result.timeRecovered, color: '#d946ef' },
    { label: 'Ganho de Produtividade', value: result.productivityGain, color: '#d946ef' },
    { label: 'Tempo de Implementação', value: result.implementationTimeframe, color: '#22d3ee' },
  ];

  const score = result.potentialTransformationScore;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div id="pdf-report" style={{
      width: '210mm',
      backgroundColor: '#010411',
      color: '#d1d5db',
      fontFamily: "'Inter', sans-serif",
      padding: '15mm',
      fontSize: '10.5pt', // Increased base font size
      lineHeight: 1.5,
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <header style={{ textAlign: 'center', borderBottom: '2px solid #00f6ff', paddingBottom: '10mm', marginBottom: '10mm' }}>
        <h1 style={{ color: '#00f6ff', fontSize: '30pt', fontWeight: 800, margin: 0, textShadow: '0 0 8px #00f6ff' }}>
          DIAGNÓSTICO NEXUS
        </h1>
        <p style={{ fontSize: '14pt', marginTop: '2mm', color: '#e5e7eb' }}>
          Análise Estratégica de Implementação de IA
        </p>
      </header>

      {/* Two-Column Section */}
      <div style={{ display: 'flex', gap: '10mm', alignItems: 'flex-start', marginBottom: '8mm' }}>
        {/* Left Column (Score + KPIs) */}
        <div style={{ width: '58mm', display: 'flex', flexDirection: 'column', gap: '5mm' }}>
          <div style={{ backgroundColor: 'rgba(10, 15, 39, 0.6)', border: '1px solid rgba(0, 246, 255, 0.2)', borderRadius: '12px', padding: '6mm', textAlign: 'center' }}>
            <h2 style={{ fontSize: '12pt', fontWeight: 600, color: '#ffffff', margin: '0 0 5mm 0' }}>
              Potencial de Transformação
            </h2>
             <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="pdfGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff00c1" />
                      <stop offset="100%" stopColor="#00f6ff" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="40" stroke="#374151" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="url(#pdfGaugeGradient)" strokeWidth="8" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)" />
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: '24pt', fontWeight: 700, fill: 'white' }}>
                    {score}
                  </text>
                </svg>
            </div>
          </div>
          
          {kpis.map(kpi => (
              <div key={kpi.label} style={{ backgroundColor: 'rgba(10, 15, 39, 0.6)', border: '1px solid rgba(0, 246, 255, 0.2)', borderRadius: '8px', padding: '4mm' }}>
                  <p style={{ margin: 0, fontSize: '9pt', color: '#9ca3af' }}>{kpi.label}</p>
                  <p style={{ margin: '2mm 0 0 0', fontSize: '14.5pt', fontWeight: 700, color: kpi.color }}>{kpi.value}</p>
              </div>
          ))}
          
          {diagnosisData.mainBottleneck && diagnosisData.mainBottleneck !== 'skip' && (
            <div style={{ backgroundColor: 'rgba(10, 15, 39, 0.6)', border: '1px solid rgba(0, 246, 255, 0.2)', borderRadius: '8px', padding: '4mm' }}>
                <p style={{ margin: 0, fontSize: '9pt', color: '#9ca3af' }}>Principal Desafio Mapeado</p>
                <p style={{ margin: '2mm 0 0 0', fontSize: '10pt', fontWeight: 600, color: '#e5e7eb' }}>{diagnosisData.mainBottleneck}</p>
            </div>
          )}

        </div>

        {/* Right Column (Summary) */}
        <div style={{ width: '112mm' }}>
            <h2 style={{ fontSize: '14.5pt', fontWeight: 700, color: '#ffffff', borderBottom: '1px solid #ff00c1', paddingBottom: '2mm', marginBottom: '4mm' }}>
              Resumo Executivo
            </h2>
            {/* Texto institucional Sparkle */}
            <p style={{ margin: '0 0 4mm 0' }}>
              A Sparkle analisou os principais gargalos do seu modelo de operação e mapeou ganhos diretos com IA — usando as mesmas tecnologias que aplicamos internamente em nossas automações de atendimento (Zenya) e conteúdo (Juno). Este diagnóstico conecta dados reais do seu negócio ao nosso ecossistema de IAs para acelerar resultados com segurança e previsibilidade.
            </p>
            {/* Resumo específico gerado pela IA (mantido) */}
            <p style={{ margin: '0 0 8mm 0' }}>{result.executiveSummary}</p>
        </div>
      </div>

      {/* Single-Column Section */}
      <div>
        {/* Mapa de Oportunidades e Índice de Maturidade */}
        <OpportunityMap />
        <MaturityChart />
        <h2 style={{ fontSize: '14.5pt', fontWeight: 700, color: '#ffffff', borderBottom: '1px solid #ff00c1', paddingBottom: '2mm', marginBottom: '6mm' }}>
          Plano de Ação: Soluções Recomendadas
        </h2>
        {result.solutions.map((solution, index) => (
          <div key={index} style={{ marginBottom: '8mm', pageBreakInside: 'avoid' }}>
            <div style={{ backgroundColor: 'rgba(10, 15, 39, 0.6)', border: '1px solid rgba(0, 246, 255, 0.2)', borderRadius: '12px', padding: '6mm' }}>
              <h3 style={{ fontSize: '12.5pt', fontWeight: 700, color: '#00f6ff', marginTop: 0 }}>
                {index + 1}. {solution.title}
              </h3>
              <p style={{ fontStyle: 'italic', color: '#9ca3af', marginTop: '2mm', borderLeft: '3px solid #00f6ff', paddingLeft: '4mm' }}>
                {solution.description}
              </p>
              
              <h4 style={{ fontSize: '11pt', fontWeight: 600, color: '#ffffff', marginTop: '5mm', marginBottom: '2mm' }}>
                Análise Detalhada
              </h4>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '10pt' }}>{solution.detailedExplanation}</p>
              
              <div style={{ marginTop: '5mm', display: 'flex', justifyContent: 'space-between', gap: '5mm' }}>
                  <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '9pt', color: '#9ca3af' }}>Implementação</p>
                      <p style={{ margin: '1mm 0 0 0', fontSize: '11.5pt', fontWeight: 600, color: '#22d3ee' }}>{solution.implementationTime}</p>
                  </div>
                   <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '9pt', color: '#9ca3af' }}>ROI Esperado</p>
                      <p style={{ margin: '1mm 0 0 0', fontSize: '11.5pt', fontWeight: 600, color: '#d946ef' }}>{solution.expectedROI}</p>
                  </div>
              </div>

              <h4 style={{ fontSize: '11pt', fontWeight: 600, color: '#ffffff', marginTop: '5mm', marginBottom: '3mm' }}>
                Benefícios Chave
              </h4>
              {solution.benefits.map((benefit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '2mm' }}>
                  <span style={{ color: '#22c55e', marginRight: '3mm', fontSize: '12pt' }}>&#10003;</span>
                  <span style={{ fontSize: '10pt' }}>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Insights estratégicos antes do CTA */}
        <InsightsBlock />

        {/* Call to Action */}
        <footer style={{ marginTop: '8mm', paddingTop: '8mm', borderTop: '1px solid rgba(0, 246, 255, 0.2)', textAlign: 'center', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '14.5pt', fontWeight: 700, color: '#ffffff' }}>Próximos Passos</h2>
          <p style={{ maxWidth: '150mm', margin: '3mm auto 6mm auto', fontSize: '10.5pt' }}>O diagnóstico é o primeiro passo. A consultoria estratégica é a rota mais rápida para transformar estes insights em um plano de implementação personalizado.</p>
          <a id="pdf-calendly-button" href={APP_CONFIG.calendlyLink} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: 'white',
              fontSize: '11pt',
              fontWeight: 600,
              padding: '3mm 6mm',
              lineHeight: '1',
              borderRadius: '8px',
              backgroundImage: 'linear-gradient(to right, #00f6ff, #ff00c1)'
          }}>
              Agendar Call Estratégica Gratuita
          </a>
          <p style={{ marginTop: '3mm', color: '#cbd5e1', fontSize: '9.5pt' }}>
            Mapeamos o escopo, integrações e próximos passos para implementar IA com a Sparkle.
          </p>
        </footer>
      </div>

      <div style={{ marginTop: '10mm', textAlign: 'center', fontSize: '9pt', color: '#9ca3af', width: '100%' }}>
          <p style={{margin: 0}}>Relatório gerado por NEXUS para análise estratégica.</p>
      </div>
    </div>
  );
};