import React, { useState, useEffect, useRef } from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
  isTransitioning: boolean;
}

const useTypingEffect = (text: string, speed = 50, start = false) => {
  const [displayedText, setDisplayedText] = useState('');

  // Effect to reset the animation when the start signal is received
  useEffect(() => {
    if (start && text) {
      setDisplayedText('');
    }
  }, [text, start]);
  
  // Effect to handle the typing character by character
  useEffect(() => {
    if (!start || !text || displayedText.length >= text.length) {
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(text.substring(0, displayedText.length + 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [displayedText, text, speed, start]);

  return displayedText;
};

const InfoPill: React.FC<{ value: string; label: string; className?: string; show: boolean }> = ({ value, label, className, show }) => (
  <div className={`text-center transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
    <p className={`text-2xl font-bold ${className}`}>{value}</p>
    <p className="text-sm text-slate-400">{label}</p>
  </div>
);


export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, isTransitioning }) => {
    const [showTitle, setShowTitle] = useState(false);
    const [showTextBox, setShowTextBox] = useState(false);
    const [showButtonAndInfo, setShowButtonAndInfo] = useState(false);

    const introText = "Responda a algumas perguntas e receba um diagnóstico estratégico de IA para o seu negócio. Vou mapear seus principais gargalos operacionais e entregar um plano de ação claro para economizar tempo, reduzir custos e aumentar sua receita.";
    const typedText = useTypingEffect(introText, 16, showTextBox);

    useEffect(() => {
        const timer1 = setTimeout(() => setShowTitle(true), 200);
        const timer2 = setTimeout(() => setShowTextBox(true), 1000);
        const timer3 = setTimeout(() => setShowButtonAndInfo(true), 1200 + introText.length * 16);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [introText.length]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 -translate-y-5' : 'opacity-100'}`}>
        <h1 
          className={`glitch text-6xl sm:text-7xl md:text-8xl font-bold text-glow transition-opacity duration-700 ${showTitle ? 'opacity-100' : 'opacity-0'}`}
          data-text="NEXUS"
        >
          NEXUS
        </h1>
        <p className="text-lg text-slate-300 mt-2 mb-10">Sistema de Análise Empresarial Avançado</p>
      </div>

      <div 
        className={`glass-pane rounded-2xl p-8 w-full max-w-2xl mb-10 transition-all duration-500 ease-in-out ${showTextBox ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${isTransitioning ? 'animate-transmission-off' : ''}`}
        style={{ minHeight: '120px' }}
      >
        <p className="text-slate-200 text-lg">
          {typedText}
          <span className="inline-block w-0.5 h-5 bg-cyan-400 animate-pulse ml-1"></span>
        </p>
      </div>
      
      <div className={`w-full max-w-2xl transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-5' : 'opacity-100'}`}>
        <button
          onClick={onStart}
          className={`px-10 py-4 font-semibold rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white shadow-lg transition-all duration-500 transform hover:scale-105 hover:shadow-cyan-400/50 focus:outline-none ${showButtonAndInfo ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        >
          INICIAR DIAGNÓSTICO
        </button>
      </div>

      <div className="flex justify-around w-full max-w-xl mt-16">
        <InfoPill value="98%" label="Precisão" className="text-glow" show={showButtonAndInfo} />
        <InfoPill value="5min" label="Análise Completa" className="text-glow-secondary" show={showButtonAndInfo} />
        <InfoPill value="24/7" label="Disponível" className="text-glow" show={showButtonAndInfo} />
      </div>
    </div>
  );
};