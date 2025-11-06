import React, { useState, useEffect } from 'react';

const statusTexts = [
    '> Identificando padrões e oportunidades...',
    '> Calculando ROI potencial...',
    '> Gerando roadmap personalizado...'
];

export const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) {
          clearInterval(progressInterval);
          return 99;
        }
        return prev + 1;
      });
    }, 80);

    const statusInterval = setInterval(() => {
        setStatusIndex(prev => (prev + 1) % statusTexts.length);
    }, 2500);

    return () => {
        clearInterval(progressInterval);
        clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in glass-pane rounded-2xl w-full max-w-2xl mx-auto">
      <div className="font-mono text-left w-full max-w-md space-y-2 mb-8">
        <p className="text-cyan-400">
            <span className="text-pink-500">&gt;</span> Processando dados... <span className="text-green-400">OK</span>
        </p>
        <p className="text-cyan-400">
            <span className="text-pink-500">&gt;</span> Conectando ao núcleo de IA... <span className="text-green-400">OK</span>
        </p>
        <p className="text-cyan-400 animate-pulse">{statusTexts[statusIndex]}</p>
      </div>

      <div className="w-full max-w-md">
        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full transition-all duration-500 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-2xl font-bold mt-4 text-glow">{progress}%</p>
      </div>

      <p className="text-slate-400 mt-8 max-w-md">
        Nexus está calibrando a matriz de IA para um diagnóstico preciso.
      </p>
    </div>
  );
};
