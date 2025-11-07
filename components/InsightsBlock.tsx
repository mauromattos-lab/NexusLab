import React from 'react';

export const InsightsBlock: React.FC = () => {
  return (
    <div style={{ backgroundColor: 'rgba(10, 15, 39, 0.6)', border: '1px solid rgba(0, 246, 255, 0.2)', borderRadius: '8px', padding: '6mm', marginTop: '8mm', pageBreakInside: 'avoid' }}>
      <h3 style={{ margin: 0, marginBottom: '4mm', color: '#00f6ff', fontSize: '12.5pt', fontWeight: 700 }}>Insights Estratégicos Sparkle</h3>
      <ul style={{ margin: 0, paddingLeft: '5mm', color: '#e5e7eb', fontSize: '10.5pt' }}>
        <li style={{ marginBottom: '3mm' }}>O gargalo mais crítico está na etapa de conversão inicial — uma IA de atendimento pode dobrar a taxa de resposta.</li>
        <li style={{ marginBottom: '3mm' }}>Há perda de eficiência entre produção e postagem — a IA de conteúdo (Juno) reduz esse gap com automação integrada.</li>
        <li>O potencial de ROI aumenta quando as automações conversam entre si (ex.: Zenya envia dados para o Juno gerar novos conteúdos).</li>
      </ul>
    </div>
  );
};
