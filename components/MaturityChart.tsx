import React from 'react';

interface BarProps {
  label: string;
  from: number; // 0-5
  to: number;   // 0-5
}

const Bar: React.FC<BarProps> = ({ label, from, to }) => {
  const width = 220;
  const height = 16;
  const scale = (v: number) => (v / 5) * width;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <span style={{ width: 90, color: '#9ca3af', fontSize: '10pt' }}>{label}</span>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <rect x={0} y={0} width={width} height={height} rx={8} ry={8} fill="#0f172a" />
        <rect x={0} y={0} width={scale(from)} height={height} rx={8} ry={8} fill="rgba(148,163,184,0.5)" />
        <linearGradient id="gradTo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff00c1" />
          <stop offset="100%" stopColor="#00f6ff" />
        </linearGradient>
        <rect x={0} y={0} width={scale(to)} height={height} rx={8} ry={8} fill="url(#gradTo)" opacity={0.9} />
      </svg>
      <span style={{ width: 48, color: '#e5e7eb', fontSize: '10pt', textAlign: 'right' }}>{from}/5 → {to}/5</span>
    </div>
  );
};

export const MaturityChart: React.FC = () => {
  const data: BarProps[] = [
    { label: 'Atendimento', from: 2, to: 5 },
    { label: 'Conteúdo', from: 1, to: 4 },
    { label: 'Operação', from: 3, to: 5 },
    { label: 'Decisão', from: 2, to: 4 },
  ];

  return (
    <div style={{ backgroundColor: 'rgba(10, 15, 39, 0.6)', border: '1px solid rgba(0, 246, 255, 0.2)', borderRadius: '8px', padding: '6mm', marginBottom: '8mm' }}>
      <h3 style={{ margin: 0, marginBottom: '4mm', color: '#00f6ff', fontSize: '12.5pt', fontWeight: 700 }}>Índice de Maturidade em IA</h3>
      <div>
        {data.map((b) => (
          <Bar key={b.label} {...b} />
        ))}
      </div>
    </div>
  );
};
