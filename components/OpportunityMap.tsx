import React from 'react';

export const OpportunityMap: React.FC = () => {
  return (
    <div style={{ backgroundColor: 'rgba(10, 15, 39, 0.6)', border: '1px solid rgba(0, 246, 255, 0.2)', borderRadius: '8px', padding: '6mm', marginBottom: '8mm' }}>
      <h3 style={{ margin: 0, marginBottom: '4mm', color: '#00f6ff', fontSize: '12.5pt', fontWeight: 700 }}>Mapa de Oportunidades de IA</h3>
      <div style={{ border: '1px solid rgba(0, 246, 255, 0.15)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '28mm 1fr 48mm', backgroundColor: 'rgba(0, 246, 255, 0.08)', color: '#e5e7eb' }}>
          <div style={{ padding: '3mm 4mm', fontWeight: 600 }}>Área</div>
          <div style={{ padding: '3mm 4mm', fontWeight: 600 }}>Solução IA</div>
          <div style={{ padding: '3mm 4mm', fontWeight: 600 }}>Impacto Esperado</div>
        </div>
        {[
          ['Atendimento', 'Zenya (IA de WhatsApp)', '+60% agilidade nas respostas'],
          ['Conteúdo', 'Juno (roteiros automáticos)', '+3x frequência de publicação'],
          ['Diagnóstico', 'Nexus', '+25% conversões por personalização'],
          ['Operação', 'Automações Sparkle', '−40% tempo em tarefas repetitivas'],
        ].map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '28mm 1fr 48mm', backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', color: '#d1d5db' }}>
            <div style={{ padding: '3mm 4mm' }}>{row[0]}</div>
            <div style={{ padding: '3mm 4mm' }}>{row[1]}</div>
            <div style={{ padding: '3mm 4mm', color: '#22c55e', fontWeight: 600 }}>{row[2]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
