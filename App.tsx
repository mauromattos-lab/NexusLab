import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatScreen } from './components/DiagnosisForm';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { getDiagnosis } from './services/geminiService';
import { saveLead } from './services/supabaseService';
import type { DiagnosisResult, DiagnosisData } from './types';

type AppStep = 'welcome' | 'transition_to_chat' | 'chat' | 'loading' | 'results';

const audioManager = {
  ctx: null as AudioContext | null,
  isInitialized: false,
  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.isInitialized = true;
  },
  playSound(type: 'typing' | 'submit' | 'transition' | 'notification') {
    if (!this.ctx) return;
    const oscillator = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    let freq = 440, duration = 0.1, gain = 0.05;

    switch (type) {
      case 'typing':
        freq = 1200; duration = 0.05; gain = 0.02;
        oscillator.type = 'sine';
        break;
      case 'submit':
        freq = 600; duration = 0.2; gain = 0.08;
        oscillator.type = 'triangle';
        break;
      case 'transition':
         freq = 200; duration = 0.4; gain = 0.1;
         oscillator.type = 'sawtooth';
         break;
      case 'notification':
        freq = 880; duration = 0.15; gain = 0.07;
        oscillator.type = 'sine';
        break;
    }

    oscillator.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gainNode.gain.setValueAtTime(gain, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    oscillator.start(this.ctx.currentTime);
    oscillator.stop(this.ctx.currentTime + duration);
  }
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('welcome');
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    audioManager.init();
    audioManager.playSound('submit');
    setStep('transition_to_chat');
    setTimeout(() => setStep('chat'), 1000); // Wait for transition animation
  };
  
  const handleReset = () => {
    audioManager.playSound('transition');
    setStep('welcome');
    setDiagnosisData(null);
    setDiagnosisResult(null);
    setError(null);
  };

  const handleChatComplete = (data: DiagnosisData) => {
    audioManager.playSound('submit');
    setDiagnosisData(data);
    setStep('loading');
    setError(null);
  };

  const runDiagnosis = useCallback(async () => {
    if (!diagnosisData) return;

    try {
      const result = await getDiagnosis(diagnosisData);
      
      // Save lead (disabled for now as email is removed)
      // if(diagnosisData.email) {
      //   await saveLead(diagnosisData, result);
      // }

      setDiagnosisResult(result);
      audioManager.playSound('notification');
      setStep('results');
    } catch (err) {
      console.error("Diagnosis Error:", err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro. Tente novamente.");
      setStep('chat'); // Go back to chat on error
    }
  }, [diagnosisData]);

  useEffect(() => {
    if (step === 'loading') {
      runDiagnosis();
    }
  }, [step, runDiagnosis]);
  
  const renderContent = () => {
    switch (step) {
      case 'welcome':
      case 'transition_to_chat':
        return <WelcomeScreen onStart={handleStart} isTransitioning={step === 'transition_to_chat'} />;
      case 'chat':
        return <ChatScreen onSubmit={handleChatComplete} error={error} audioManager={audioManager} onReset={handleReset} />;
      case 'loading':
        return <LoadingScreen />;
      case 'results':
        return diagnosisResult && diagnosisData ? <ResultsScreen result={diagnosisResult} diagnosisData={diagnosisData} onReset={handleReset} audioManager={audioManager} /> : <LoadingScreen />;
      default:
        return <WelcomeScreen onStart={handleStart} isTransitioning={false} />;
    }
  };

  return (
    <div className="min-h-screen font-sans flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-5xl h-[90vh] flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;