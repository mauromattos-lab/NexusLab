import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, DiagnosisData } from '../types';

interface ChatScreenProps {
  onSubmit: (data: DiagnosisData) => void;
  error: string | null;
  audioManager: any;
  onReset: () => void;
}

const useTypingEffect = (text: string, speed = 16, audioManager: any, onComplete?: () => void) => {
    const [displayedText, setDisplayedText] = useState('');
    const onCompleteRef = useRef(onComplete);
  
    useEffect(() => {
      onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Reset when text changes
    useEffect(() => {
        if (text) {
            setDisplayedText('');
        }
    }, [text]);

    useEffect(() => {
        if (!text) return;

        if (displayedText.length >= text.length) {
            onCompleteRef.current?.();
            return;
        }

        const timer = setTimeout(() => {
            setDisplayedText(text.substring(0, displayedText.length + 1));
            // Play sound less frequently to avoid being annoying
            if ((displayedText.length) % 4 === 0) {
                audioManager.playSound('typing');
            }
        }, speed);

        return () => clearTimeout(timer);
    }, [displayedText, text, speed, audioManager]);

    return displayedText;
};


const NexusMessage: React.FC<{ message: ChatMessage; onComplete?: () => void; audioManager: any }> = React.memo(({ message, onComplete, audioManager }) => {
    const typedText = useTypingEffect(message.text, 16, audioManager, onComplete);
    
    return (
        <div className="flex items-start gap-3 animate-fade-in-up">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">N</div>
            <div className="glass-pane rounded-xl rounded-tl-none p-4 max-w-xl">
                <p className="text-slate-200 whitespace-pre-wrap">{typedText}{!onComplete && <span className="inline-block w-0.5 h-4 bg-cyan-400 animate-pulse ml-1"></span>}</p>
            </div>
        </div>
    );
});

const UserMessage: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex justify-end animate-fade-in-up">
        <div className="bg-indigo-600 rounded-xl rounded-br-none p-4 max-w-xl">
            <p className="text-white whitespace-pre-wrap">{text}</p>
        </div>
    </div>
);

const conversationFlow: ({
    id: string;
    text: string;
    key?: keyof DiagnosisData;
    businessType?: 'appointment_services' | 'quote_services' | 'recurring_services' | 'products';
    input?: { type: 'text' | 'email' | 'number'; placeholder: string; key: keyof DiagnosisData; };
    options?: { text: string; value: any; description?: string }[];
})[] = [
    { id: 'intro1', text: 'Olá. Eu sou o NEXUS. Minha função é analisar os parâmetros do seu negócio para identificar oportunidades de transformação com Inteligência Artificial.' },
    { id: 'intro2', text: 'O processo é rápido, cerca de 2 minutos. Ao final, você receberá um diagnóstico estratégico. Vamos começar.' },
    { id: 'getName', text: 'Primeiro, preciso de alguns dados básicos para calibrar a análise. Qual o seu nome e o nome da sua empresa?', input: { type: 'text', placeholder: 'Seu Nome, Nome da Empresa', key: 'userName' } },
    { id: 'segment', key: 'businessType', text: 'Perfeito. Agora, vamos ao núcleo da análise. Para otimizar os cálculos, preciso entender a natureza da sua operação. Sua empresa opera principalmente com:', options: [
        { text: 'Serviços com Agendamento', value: 'appointment_services', description: 'Ex: Clínicas, barbearias, salões' }, 
        { text: 'Serviços por Orçamento', value: 'quote_services', description: 'Ex: Agências, B2B, construção' },
        { text: 'Serviços Recorrentes', value: 'recurring_services', description: 'Ex: Academias, SaaS, clubes' },
        { text: 'Venda de Produtos', value: 'products', description: 'Ex: Lojas, restaurantes, delivery' },
    ] },
    
    // Appointment-based Service Path
    { id: 'getAppointments', businessType: 'appointment_services', text: 'Entendido. Operações baseadas em agendamento possuem três variáveis críticas: volume, tempo e comparecimento. Vamos quantificar a sua. Em um mês típico, qual é o volume de agendamentos que seu negócio realiza?', key: 'monthlyAppointments', input: { type: 'number', placeholder: 'Ex: 150', key: 'monthlyAppointments' }, options: [{ text: 'Menos de 50', value: 50 }, { text: 'Entre 50 e 150', value: 100 }, { text: 'Mais de 150', value: 200 }] },
    { id: 'getNoShow', key: 'noShowRate', businessType: 'appointment_services', text: "Agora, um parâmetro sensível: a taxa de 'no-show'. De cada 10 clientes com horário marcado, quantos, em média, não aparecem?", options: [{ text: '1 em 10 (10%)', value: 0.1 }, { text: '2 em 10 (20%)', value: 0.2 }, { text: '3 ou mais (+25%)', value: 0.25 }, { text: 'Quase ninguém', value: 0 }] },
    { id: 'getTicket', businessType: 'appointment_services', text: 'Entendido. Agora, vamos traduzir isso em impacto financeiro. Qual é o valor médio que você fatura por atendimento? (Seu ticket médio)', key: 'ticketPrice', input: { type: 'number', placeholder: 'Ex: 200', key: 'ticketPrice' }, options: [{ text: 'R$ 50', value: 50 }, { text: 'R$ 150', value: 150 }, { text: 'R$ 300', value: 300 }] },
    { id: 'impactMessageAppointments', businessType: 'appointment_services', text: 'Calculando... Com base nos seus dados, a taxa de no-show representa um prejuízo estimado de R$ {loss} todos os meses. É um valor que está sendo deixado na mesa por falta de um sistema proativo.' },

    // Quote-based Service Path
    { id: 'getQuotes', businessType: 'quote_services', text: 'Compreendido. Para negócios baseados em orçamento, o funil de vendas é tudo. Quantos orçamentos, em média, sua equipe envia por mês?', key: 'monthlyQuotes', input: { type: 'number', placeholder: 'Ex: 50', key: 'monthlyQuotes' }, options: [{ text: 'Menos de 20', value: 20 }, { text: 'Entre 20 e 50', value: 35 }, { text: 'Mais de 50', value: 70 }] },
    { id: 'getConversionRate', key: 'quoteConversionRate', businessType: 'quote_services', text: 'E desses orçamentos enviados, qual é a taxa de conversão? De cada 10 propostas, quantas se tornam um negócio fechado?', options: [{ text: '1 a 2 (15%)', value: 0.15 }, { text: '3 a 4 (35%)', value: 0.35 }, { text: '5 ou mais (+50%)', value: 0.5 }, { text: 'Mais de 7 (70%)', value: 0.7 }] },
    { id: 'getAvgDealValue', businessType: 'quote_services', text: 'Ok. E qual é o valor médio de cada contrato ou serviço fechado a partir desses orçamentos?', key: 'avgDealValue', input: { type: 'number', placeholder: 'Ex: 5000', key: 'avgDealValue' }, options: [{ text: 'R$ 1.000', value: 1000 }, { text: 'R$ 5.000', value: 5000 }, { text: 'R$ 15.000', value: 15000 }] },

    // Recurring Service Path
    { id: 'getSubscribers', businessType: 'recurring_services', text: 'Entendido. Em modelos de assinatura, a retenção é a chave. Quantos clientes ou assinantes ativos sua empresa possui atualmente?', key: 'activeSubscribers', input: { type: 'number', placeholder: 'Ex: 200', key: 'activeSubscribers' }, options: [{ text: 'Menos de 100', value: 100 }, { text: 'Entre 100 e 300', value: 200 }, { text: 'Mais de 300', value: 400 }] },
    { id: 'getChurnRate', key: 'monthlyChurnRate', businessType: 'recurring_services', text: 'Agora, um KPI vital: a taxa de cancelamento (churn). Qual a porcentagem de clientes que cancelam a assinatura a cada mês?', options: [{ text: 'Menos de 2%', value: 0.02 }, { text: 'Entre 3% e 5%', value: 0.04 }, { text: 'Entre 6% e 10%', value: 0.08 }, { text: 'Mais de 10%', value: 0.1 }] },
    { id: 'getAvgSubscription', businessType: 'recurring_services', text: 'Para finalizar a análise de receita, qual é o valor médio da mensalidade ou assinatura por cliente?', key: 'avgSubscriptionFee', input: { type: 'number', placeholder: 'Ex: 99', key: 'avgSubscriptionFee' }, options: [{ text: 'R$ 50', value: 50 }, { text: 'R$ 99', value: 99 }, { text: 'R$ 199', value: 199 }] },
    { id: 'getMemberEngagement', key: 'memberEngagementProcess', businessType: 'recurring_services', text: 'Ótimo. Além de cancelamentos, a falta de engajamento é um sinal de alerta. Existe algum processo automático para motivar alunos que não frequentam há algum tempo ou para comunicar novidades e aulas?', options: [{ text: 'Fazemos isso manualmente', value: 'manual_inconsistent' }, { text: 'Temos um sistema de e-mails/grupo', value: 'basic_automation' }, { text: 'Não temos um processo ativo para isso', value: 'inactive' }] },
    
    // Product Sales Path (Local Business)
    { id: 'getRepetitiveQuestionsLocal', key: 'repetitiveQuestionsLocal', businessType: 'products', text: "Entendido: Venda de Produtos. Em negócios locais, a comunicação direta é um ponto-chave. Com que frequência sua equipe responde às mesmas perguntas todos os dias (Ex: 'Tem o produto X?', 'Qual o preço?', 'Estão abertos?') via WhatsApp ou telefone?", options: [{ text: 'O tempo todo, consome muitas horas', value: 'constant' }, { text: 'Algumas vezes por dia', value: 'sometimes' }, { text: 'Raramente', value: 'rarely' }] },
    { id: 'getLocalOrderProcess', key: 'localOrderProcess', businessType: 'products', text: "Certo. E como funciona o processo de encomendas ou pedidos para retirada? (Ex: um bolo para uma padaria, uma cesta de presentes, etc.)", options: [{ text: 'É manual via WhatsApp/telefone e às vezes confuso', value: 'manual_chaotic' }, { text: 'Temos um processo manual, mas é bem organizado', value: 'manual_organized' }, { text: 'Não trabalhamos com encomendas', value: 'no_orders' }] },
    { id: 'getPromotionCommunication', key: 'promotionCommunication', businessType: 'products', text: "Perfeito. E para manter os clientes voltando, como você comunica novidades, promoções ou a chegada de novos produtos?", options: [{ text: 'Manualmente, por listas/grupos de WhatsApp', value: 'manual_broadcast' }, { text: 'Apenas postamos nas redes sociais', value: 'social_media_only' }, { text: 'Não temos um processo ativo para isso', value: 'inactive' }] },
    { id: 'getAvgOrderValueLocal', businessType: 'products', text: 'Ótimo. Para calcular o potencial de aumento de receita, qual é o valor médio de cada venda em sua loja? (Seu ticket médio)', key: 'avgOrderValueLocal', input: { type: 'number', placeholder: 'Ex: 150', key: 'avgOrderValueLocal' }, options: [{ text: 'R$ 50', value: 50 }, { text: 'R$ 150', value: 150 }, { text: 'R$ 300', value: 300 }] },
    { id: 'getWeeklyLostSalesLocal', businessType: 'products', text: 'Entendido. Agora, seja sincero: quantos pedidos ou vendas você acredita que perde por semana por não conseguir responder a tempo ou por atritos no processo manual?', key: 'weeklyLostSalesLocal', input: { type: 'number', placeholder: 'Ex: 10', key: 'weeklyLostSalesLocal' }, options: [{ text: '1 a 2', value: 2 }, { text: '3 a 5', value: 4 }, { text: 'Mais de 5', value: 7 }] },
    
    // Common Path
    { id: 'getCommHours', key: 'manualCommHours', businessType: 'appointment_services', text: 'As tarefas manuais de comunicação (confirmar horários, responder dúvidas, etc.) consomem quantas horas de trabalho por dia da sua equipe?', options: [{ text: 'Menos de 1 hora', value: '<1' }, { text: 'Entre 1 e 3 horas', value: '1-3' }, { text: 'Mais de 3 horas', value: '>3' }] },
    { id: 'getCommHoursQuote', key: 'manualCommHours', businessType: 'quote_services', text: 'Além da criação, quanto tempo é gasto em tarefas de comunicação manual (follow-up de orçamentos, responder dúvidas, etc.) por dia?', options: [{ text: 'Menos de 1 hora', value: '<1' }, { text: 'Entre 1 e 3 horas', value: '1-3' }, { text: 'Mais de 3 horas', value: '>3' }] },
    { id: 'getCommHoursRecurring', key: 'manualCommHours', businessType: 'recurring_services', text: 'Quanto tempo sua equipe dedica por dia a tarefas de comunicação e suporte manual (dúvidas sobre pagamentos, agendamentos, etc.)?', options: [{ text: 'Menos de 1 hora', value: '<1' }, { text: 'Entre 1 e 3 horas', value: '1-3' }, { text: 'Mais de 3 horas', value: '>3' }] },
    { id: 'getCommHoursProduct', key: 'manualCommHours', businessType: 'products', text: 'Considerando as perguntas, encomendas e comunicações, quantas horas por dia sua equipe gasta nessas tarefas manuais?', options: [{ text: 'Menos de 1 hora', value: '<1' }, { text: 'Entre 1 e 3 horas', value: '1-3' }, { text: 'Mais de 3 horas', value: '>3' }] },
    { id: 'getOffHoursResponse', key: 'offHoursResponse', text: 'Ótimo. E o que acontece quando um potencial cliente entra em contato fora do horário comercial?', options: [{ text: 'Respondemos no dia seguinte', value: 'manual_next_day' }, { text: 'Temos uma resposta automática', value: 'automated' }, { text: 'Não temos um processo definido', value: 'undefined' }] },
    { id: 'impactMessageOffHours', text: 'Este texto será substituído dinamicamente.' },
    { id: 'getReviewProcess', key: 'reviewRequestProcess', text: 'Entendido. E sobre a reputação online, como sua empresa solicita avaliações de clientes, como no Google, após o serviço/compra?', options: [{ text: 'Manualmente, quando lembramos', value: 'manual_inconsistent' }, { text: 'Temos um sistema automático', value: 'automated' }, { text: 'Não solicitamos ativamente', value: 'inactive' }] },
    { id: 'getClientReengagementAppointment', key: 'clientReengagementProcess', businessType: 'appointment_services', text: 'Pensando em crescimento, existe algum processo para reativar clientes antigos que não agendam há algum tempo?', options: [{ text: 'Manualmente, quando dá tempo', value: 'manual_inconsistent' }, { text: 'Temos um processo automático', value: 'automated' }, { text: 'Não fazemos isso ativamente', value: 'inactive' }] },
    { id: 'getClientReengagementRecurring', key: 'clientReengagementProcess', businessType: 'recurring_services', text: 'Pensando em crescimento, existe algum processo para reativar clientes que cancelaram a assinatura?', options: [{ text: 'Manualmente, quando dá tempo', value: 'manual_inconsistent' }, { text: 'Temos um processo automático', value: 'automated' }, { text: 'Não fazemos isso ativamente', value: 'inactive' }] },
    { id: 'getClientReengagementQuote', key: 'clientReengagementProcess', businessType: 'quote_services', text: 'Pensando em crescimento, existe algum processo para recontactar leads que não fecharam um orçamento no passado?', options: [{ text: 'Manualmente, quando dá tempo', value: 'manual_inconsistent' }, { text: 'Temos um processo automático', value: 'automated' }, { text: 'Não fazemos isso ativamente', value: 'inactive' }] },
    { id: 'getClientReengagementProduct', key: 'clientReengagementProcess', businessType: 'products', text: 'Pensando em crescimento, existe algum processo para reativar clientes que não compram há algum tempo (Ex: enviar uma oferta especial)?', options: [{ text: 'Manualmente, quando dá tempo', value: 'manual_inconsistent' }, { text: 'Temos um processo automático', value: 'automated' }, { text: 'Não fazemos isso ativamente', value: 'inactive' }] },

    // Final questions
    { id: 'getMainBottleneck', text: 'Ótima análise. Para finalizar, existe algum gargalo ou desafio muito específico do seu negócio que não cobrimos e que você acredita que a IA poderia resolver?', input: { type: 'text', placeholder: 'Descreva seu principal desafio...', key: 'mainBottleneck' }, options: [{ text: 'Pular esta etapa', value: 'skip' }] },
    { id: 'final', text: 'Perfeito. Tenho todas as informações necessárias. Iniciando análise profunda do seu negócio...' },
];

export const ChatScreen: React.FC<ChatScreenProps> = ({ onSubmit, error, audioManager, onReset }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [step, setStep] = useState(0);
    const [isNexusTyping, setIsNexusTyping] = useState(true);
    const [data, setData] = useState<Partial<DiagnosisData>>({});
    const chatEndRef = useRef<HTMLDivElement>(null);
    const currentFlowStep = conversationFlow[step];

    const addNexusMessage = useCallback(() => {
        setIsNexusTyping(true);
        setTimeout(() => {
            audioManager.playSound('notification');
            const flowStep = { ...conversationFlow[step] };
            if (flowStep) {
                if (flowStep.id === 'impactMessageAppointments') {
                    const loss = (data.monthlyAppointments || 0) * (data.noShowRate || 0) * (data.ticketPrice || 0);
                    flowStep.text = `Calculando... Com base nos seus dados, a taxa de no-show representa um prejuízo estimado de R$ ${loss.toFixed(2).replace('.',',')} todos os meses. É um valor que está sendo deixado na mesa por falta de um sistema proativo.`;
                }
                 if (flowStep.id === 'impactMessageOffHours') {
                    if (data.offHoursResponse === 'manual_next_day' || data.offHoursResponse === 'undefined') {
                        flowStep.text = "Registrado. É um ponto crítico. Um estudo da Harvard Business Review revelou que empresas que respondem a um lead em até uma hora têm 7 vezes mais chances de qualificá-lo. A velocidade é um diferencial competitivo direto para não perder clientes para a concorrência.";
                    } else if (data.offHoursResponse === 'automated') {
                        flowStep.text = "Excelente, você já está à frente de muitos concorrentes. Uma IA conversacional pode levar isso ao próximo nível, qualificando o lead e iniciando o processo de venda 24/7, em vez de apenas enviar uma mensagem padrão que ainda exige ação manual no dia seguinte.";
                    }
                }
                setMessages(prev => [...prev, { sender: 'nexus', ...flowStep }]);
            }
        }, 1000);
    }, [step, audioManager, data]);

    useEffect(() => {
        addNexusMessage();
    }, [step, addNexusMessage]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isNexusTyping]);

    const onTypingComplete = useCallback(() => {
        setIsNexusTyping(false);
        // Auto-advance on non-interactive messages
        if (!currentFlowStep?.options && !currentFlowStep?.input) {
             setTimeout(() => {
                let nextStepIndex = step + 1;
                if (data.businessType) {
                    while(conversationFlow[nextStepIndex] && conversationFlow[nextStepIndex].businessType && conversationFlow[nextStepIndex].businessType !== data.businessType) {
                        nextStepIndex++;
                    }
                }
                if (conversationFlow[nextStepIndex]) {
                     setStep(nextStepIndex);
                }
             }, 500);
        }
        
        if (currentFlowStep?.id === 'final') {
            setTimeout(() => onSubmit(data as DiagnosisData), 1500);
        }
    }, [currentFlowStep, data, onSubmit, step]);

    const handleInputSubmit = (value: any, displayValue?: string) => {
        if (!value && value !== 0) return;
        
        audioManager.playSound('submit');
        
        const key = currentFlowStep.input?.key || currentFlowStep.key;
        
        let newData = { ...data };
        if(key && value !== 'skip') {
            if(key === 'userName' && typeof value === 'string' && value.includes(',')) {
                const [name, company] = value.split(',').map(s => s.trim());
                newData = { ...newData, userName: name, companyName: company };
            } else {
                newData = { ...newData, [key]: value };
            }
            setData(newData);
        }
        
        const textToShow = displayValue || (value === 'skip' ? 'Pular esta etapa' : (typeof value === 'number' ? `R$ ${value}` : value.toString()));
        setMessages(prev => [...prev, { sender: 'user', text: textToShow }]);
        setUserInput('');
        
        // Find next step
        let nextStepIndex = step + 1;
        
        // Skip steps not matching business type
        if (newData.businessType) {
            let foundNext = false;
            while(conversationFlow[nextStepIndex] && !foundNext) {
                const nextStepDef = conversationFlow[nextStepIndex];
                // If the next step is generic OR matches the business type, it's a valid next step
                if (!nextStepDef.businessType || nextStepDef.businessType === newData.businessType) {
                    foundNext = true;
                } else {
                    nextStepIndex++;
                }
            }
        }
        
        setStep(nextStepIndex);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(isNexusTyping || !userInput.trim()) return;
        handleInputSubmit(userInput);
    }
    
    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-fade-in">
            <header className="glass-pane rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-2xl font-bold text-glow">N</div>
                    <div>
                        <h1 className="text-xl font-bold text-white">NEXUS</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <p className="text-sm text-green-300">Online</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onReset}
                    title="Reiniciar Diagnóstico"
                    className="p-2 text-slate-400 rounded-full transition-colors hover:bg-slate-800 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
            </header>

            <main className="flex-1 glass-pane rounded-xl p-6 overflow-y-auto min-h-0">
                <div className="space-y-6">
                    {messages.map((msg, index) => {
                         if (msg.sender === 'user') {
                            return <UserMessage key={index} text={msg.text} />;
                         }
                         return <NexusMessage 
                            key={index} 
                            message={msg}
                            onComplete={onTypingComplete}
                            audioManager={audioManager} 
                         />;
                    })}
                    <div ref={chatEndRef} />
                </div>
            </main>

            <footer className="mt-4">
                {error && <p className="text-red-400 text-center mb-2">{error}</p>}
                
                {!isNexusTyping && (currentFlowStep?.options || currentFlowStep?.input) && (
                    <div className="animate-fade-in-up">
                        {currentFlowStep.options && (
                            <div className="flex flex-wrap justify-center gap-3">
                                {currentFlowStep.options.map(opt => (
                                    <button 
                                        key={opt.text}
                                        onClick={() => handleInputSubmit(opt.value, opt.text)}
                                        className="w-full sm:w-auto glass-pane px-6 py-3 rounded-lg text-cyan-300 font-semibold border border-cyan-400/20 hover:bg-cyan-400/20 hover:text-white transition-all transform hover:scale-105 text-center"
                                    >
                                        {opt.text}
                                        {opt.description && <span className="block text-xs text-slate-400 font-normal mt-1">{opt.description}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                        {currentFlowStep.input && (
                             <>
                                {currentFlowStep.options && (
                                    <p className="text-center text-sm text-slate-400 mt-4 mb-2">Ou digite um valor específico</p>
                                )}
                                <form onSubmit={handleFormSubmit} className="relative">
                                    <input
                                        type={currentFlowStep.input.type}
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder={currentFlowStep.input.placeholder}
                                        required
                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-4 pr-16 text-slate-200 input-glow transition-all"
                                        autoFocus
                                    />
                                    <button type="submit" disabled={!userInput.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:scale-110">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                )}
            </footer>
        </div>
    );
};