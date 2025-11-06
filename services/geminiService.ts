import { GoogleGenAI, Type } from "@google/genai";
import type { DiagnosisResult, DiagnosisData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const diagnosisSchema = {
    type: Type.OBJECT,
    properties: {
        potentialTransformationScore: {
            type: Type.NUMBER,
            description: "Uma pontuação de 0 a 100 avaliando o potencial de transformação do negócio com IA, com base nos dados fornecidos. Seja criterioso."
        },
        potentialEconomy: {
            type: Type.STRING,
            description: "Estimativa de economia potencial ou ganho de receita mensal em Reais (R$). Ex: 'R$ 15.000/mês'. Deve ser baseada nos principais KPIs de perda (no-show, churn, não-conversão, vendas perdidas, tempo gasto em suporte)."
        },
        timeRecovered: {
            type: Type.STRING,
            description: "Estimativa de tempo que pode ser recuperado por semana, com base nas horas de comunicação manual. Ex: '40 horas/semana'."
        },
        productivityGain: {
            type: Type.STRING,
            description: "Estimativa de ganho de produtividade em porcentagem. Ex: '45%'."
        },
        implementationTimeframe: {
            type: Type.STRING,
            description: "Estimativa do tempo médio para implementação das principais soluções. Ex: '8-12 semanas'."
        },
        executiveSummary: {
            type: Type.STRING,
            description: "Um parágrafo de 3-4 frases que resume a análise. Comece com 'Nossa análise indica que a [Nome da Empresa] possui um potencial de transformação de IA de {score} pontos.' e, em seguida, destaque os 2 principais problemas (ex: perda de receita com no-shows, ineficiência no atendimento) e como a IA pode resolvê-los. Este texto é para o relatório em PDF."
        },
        solutions: {
            type: Type.ARRAY,
            description: "Uma lista de 3 a 4 soluções de IA acionáveis e priorizadas, focadas em resolver os problemas identificados.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "O nome da solução de IA. Ex: 'Assistente de IA para Atendimento e Vendas no WhatsApp'." },
                    description: { type: Type.STRING, description: "Descrição concisa (1-2 frases) para a tela. Explica a solução e como ela resolve um problema específico do cliente. Enfatize a comunicação humanizada e 24/7." },
                    impact: { type: Type.STRING, description: "O impacto da implementação (use apenas 'Alto', 'Médio', ou 'Baixo')." },
                    implementationTime: { type: Type.STRING, description: "Tempo estimado para implementar esta solução específica. Ex: '2-4 semanas'." },
                    expectedROI: { type: Type.STRING, description: "Retorno sobre o investimento esperado, conectando-o a um KPI. Ex: 'Redução de 80% no tempo gasto com perguntas repetitivas'." },
                    benefits: {
                        type: Type.ARRAY,
                        description: "Lista com 3 a 5 benefícios chave da solução. Ex: 'Atendimento ao cliente 24/7, mesmo fora do horário comercial'.",
                        items: { type: Type.STRING }
                    },
                    detailedExplanation: {
                        type: Type.STRING,
                        description: "Uma explicação detalhada (2-3 parágrafos) para o relatório em PDF. Elabore sobre o 'porquê' desta solução ser crucial. Detalhe o problema atual com base nos dados do cliente, explique como a tecnologia de IA (ex: Processamento de Linguagem Natural) funciona na prática para resolver isso e descreva o cenário futuro após a implementação. Seja técnico, mas claro."
                    }
                },
                required: ["title", "description", "impact", "implementationTime", "expectedROI", "benefits", "detailedExplanation"],
            }
        }
    },
    required: ["potentialTransformationScore", "potentialEconomy", "timeRecovered", "productivityGain", "implementationTimeframe", "executiveSummary", "solutions"],
};

function formatOffHoursResponse(value?: string): string {
    switch (value) {
        case 'manual_next_day': return 'Respondido manualmente no dia seguinte (risco de lead esfriar)';
        case 'automated': return 'Resposta automática configurada';
        case 'undefined': return 'Nenhum processo definido (risco alto de perder lead)';
        default: return 'N/A';
    }
}

function formatReviewProcess(value?: string): string {
    switch (value) {
        case 'manual_inconsistent': return 'Solicitado manualmente e de forma inconsistente';
        case 'automated': return 'Processo automático existente';
        case 'inactive': return 'Não solicita ativamente (oportunidade de crescimento perdida)';
        default: return 'N/A';
    }
}

function formatReengagementProcess(value?: string): string {
    switch (value) {
        case 'manual_inconsistent': return 'Contato manual e inconsistente com ex-clientes';
        case 'automated': return 'Processo automático para reativar clientes';
        case 'inactive': return 'Nenhuma ação para reengajar clientes antigos (receita recorrente perdida)';
        default: return 'N/A';
    }
}

function formatMemberEngagementProcess(value?: string): string {
    switch (value) {
        case 'manual_inconsistent': return 'Comunicação manual e esporádica para engajar alunos';
        case 'basic_automation': return 'Usa automação básica (e-mail/grupos), mas sem inteligência';
        case 'inactive': return 'Nenhuma ação proativa para engajar membros atuais (risco de churn)';
        default: return 'N/A';
    }
}

function formatRepetitiveQuestionsLocal(value?: string): string {
    switch (value) {
        case 'constant': return 'Alto. A equipe gasta horas respondendo às mesmas perguntas.';
        case 'sometimes': return 'Médio. Ocorrências diárias, mas gerenciáveis.';
        case 'rarely': return 'Baixo. As perguntas dos clientes são geralmente únicas.';
        default: return 'N/A';
    }
}

function formatLocalOrderProcess(value?: string): string {
    switch (value) {
        case 'manual_chaotic': return 'Manual e caótico, com alto risco de erros e perda de vendas.';
        case 'manual_organized': return 'Manual, mas organizado. Funcional, porém consome tempo.';
        case 'no_orders': return 'Não aplicável. O negócio não trabalha com encomendas.';
        default: return 'N/A';
    }
}

function formatPromotionCommunication(value?: string): string {
    switch (value) {
        case 'manual_broadcast': return 'Manual, via listas/grupos. Baixo alcance e personalização.';
        case 'social_media_only': return 'Passivo, depende do alcance orgânico das redes sociais.';
        case 'inactive': return 'Inexistente. Oportunidade crítica de recompra perdida.';
        default: return 'N/A';
    }
}


function buildPrompt(data: DiagnosisData): string {
    let businessSpecifics = '';
    switch (data.businessType) {
        case 'appointment_services':
            const noShowLoss = (data.monthlyAppointments || 0) * (data.noShowRate || 0) * (data.ticketPrice || 0);
            businessSpecifics = `
      - Modelo: Serviços com Agendamento
      - Volume de Agendamentos/mês: ${data.monthlyAppointments || 'N/A'}
      - Taxa de No-Show: ${data.noShowRate ? (data.noShowRate * 100).toFixed(0) + '%' : 'N/A'}
      - Ticket Médio: R$ ${data.ticketPrice || 'N/A'}
      - **Prejuízo Mensal com No-Show: R$ ${noShowLoss.toFixed(2)}**
            `;
            break;
        case 'quote_services':
            const lostRevenue = (data.monthlyQuotes || 0) * (1 - (data.quoteConversionRate || 0)) * (data.avgDealValue || 0);
            businessSpecifics = `
      - Modelo: Serviços por Orçamento
      - Orçamentos Enviados/mês: ${data.monthlyQuotes || 'N/A'}
      - Taxa de Conversão: ${data.quoteConversionRate ? (data.quoteConversionRate * 100).toFixed(0) + '%' : 'N/A'}
      - Valor Médio do Contrato: R$ ${data.avgDealValue || 'N/A'}
      - **Receita Potencial Perdida (Não-Conversão): R$ ${lostRevenue.toFixed(2)}/mês**
            `;
            break;
        case 'recurring_services':
            const churnLoss = (data.activeSubscribers || 0) * (data.monthlyChurnRate || 0) * (data.avgSubscriptionFee || 0);
            businessSpecifics = `
      - Modelo: Serviços Recorrentes
      - Assinantes Ativos: ${data.activeSubscribers || 'N/A'}
      - Taxa de Churn Mensal: ${data.monthlyChurnRate ? (data.monthlyChurnRate * 100).toFixed(0) + '%' : 'N/A'}
      - Mensalidade Média: R$ ${data.avgSubscriptionFee || 'N/A'}
      - **Prejuízo Mensal com Churn: R$ ${churnLoss.toFixed(2)}**
      - Processo de Engajamento de Membros: ${formatMemberEngagementProcess(data.memberEngagementProcess)}
            `;
            break;
        case 'products':
            const weeklyLostSales = data.weeklyLostSalesLocal || 0;
            const avgOrderValue = data.avgOrderValueLocal || 0;
            const monthlyLostRevenue = weeklyLostSales * avgOrderValue * 4.33;
            businessSpecifics = `
      - Modelo: Venda de Produtos (Negócio Local)
      - Ticket Médio: R$ ${avgOrderValue.toFixed(2)}
      - Vendas perdidas por semana (atendimento lento): ${weeklyLostSales}
      - **Prejuízo Mensal por Falha no Atendimento: R$ ${monthlyLostRevenue.toFixed(2)}**
      - Frequência de Perguntas Repetitivas (preço, estoque, horário): ${formatRepetitiveQuestionsLocal(data.repetitiveQuestionsLocal)}
      - Processo de Encomendas/Pedidos para Retirada: ${formatLocalOrderProcess(data.localOrderProcess)}
      - Comunicação de Novidades e Promoções: ${formatPromotionCommunication(data.promotionCommunication)}
            `;
            break;
    }

    return `
# INSTRUÇÃO MESTRA
Você é o NEXUS, um super-analista de negócios de IA. Sua tarefa é analisar os dados brutos de um negócio e gerar um diagnóstico estratégico em JSON. O diagnóstico deve ser acionável, quantitativo e persuasivo. As soluções devem resolver diretamente os problemas apontados. Para 'Venda de Produtos', foque nos desafios de um negócio local (atendimento, encomendas, marketing local), NÃO em e-commerce. Se um 'Principal Gargalo' for informado, garanta que pelo menos uma das soluções propostas resolva DIRETAMENTE este problema específico.

# DADOS DO NEGÓCIO PARA ANÁLISE
- Nome do Contato: ${data.userName || 'N/A'}
- Nome da Empresa: ${data.companyName || 'N/A'}
- E-mail: ${data.email || 'N/A'}

## Dados Operacionais Específicos
${businessSpecifics}

## Dados Operacionais Comuns
- Horas gastas em comunicação manual por dia: ${data.manualCommHours || 'N/A'} (Impacta diretamente o 'timeRecovered')
- Processo de resposta fora do horário comercial: ${formatOffHoursResponse(data.offHoursResponse)}
- Processo de solicitação de avaliações: ${formatReviewProcess(data.reviewRequestProcess)}
- Processo de reengajamento de clientes antigos: ${formatReengagementProcess(data.clientReengagementProcess)}

## Principal Gargalo Descrito pelo Cliente (ALTA PRIORIDADE)
- ${data.mainBottleneck || 'Nenhum informado.'}

# TAREFA
Com base nos dados acima, preencha o seguinte esquema JSON. Calcule os valores de forma realista. As soluções devem ser priorizadas pelo maior impacto. Para os campos 'executiveSummary' e 'detailedExplanation', escreva um texto profissional, detalhado e persuasivo para um relatório PDF formal.
`;
}

export const getDiagnosis = async (data: DiagnosisData): Promise<DiagnosisResult> => {
    try {
        const prompt = buildPrompt(data);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: diagnosisSchema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as DiagnosisResult;
        
        // Inject company name into summary if placeholder exists
        if(result.executiveSummary.includes('[Nome da Empresa]')) {
             result.executiveSummary = result.executiveSummary.replace(/\[Nome da Empresa\]/g, data.companyName || "seu negócio");
        }
        if(result.executiveSummary.includes('{score}')) {
             result.executiveSummary = result.executiveSummary.replace(/\{score\}/g, result.potentialTransformationScore.toString());
        }

        return result;

    } catch (error) {
        console.error("Erro ao chamar a API Gemini:", error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error("A IA retornou um formato inesperado. Por favor, tente refazer o diagnóstico.");
        }
        throw new Error("Não foi possível gerar o diagnóstico. Verifique a conexão e tente novamente.");
    }
};