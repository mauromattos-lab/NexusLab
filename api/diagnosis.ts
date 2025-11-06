import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import type { DiagnosisData, DiagnosisResult } from '../types';

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

// Baseline determinístico com base nos KPIs objetivos
function computeBaseline(data: DiagnosisData): number {
  let score = 50; // ponto de partida

  switch (data.businessType) {
    case 'appointment_services': {
      const appts = data.monthlyAppointments || 0;
      const noShow = (data.noShowRate || 0) * 100; // %
      const ticket = data.ticketPrice || 0;
      // Quanto maior o volume e ticket, maior potencial; quanto maior o no-show, maior espaço para IA
      score += clamp(appts / 10, 0, 20); // até +20
      score += clamp((noShow - 5) / 2, 0, 15); // até +15 para no-show > 5%
      score += clamp(ticket / 100, 0, 10); // até +10
      break;
    }
    case 'quote_services': {
      const quotes = data.monthlyQuotes || 0;
      const conv = (data.quoteConversionRate || 0) * 100;
      const deal = data.avgDealValue || 0;
      score += clamp(quotes / 5, 0, 15); // até +15
      score += clamp((50 - conv) / 3, 0, 15); // quanto menor a conversão, maior potencial
      score += clamp(deal / 2000, 0, 10); // até +10
      break;
    }
    case 'recurring_services': {
      const subs = data.activeSubscribers || 0;
      const churn = (data.monthlyChurnRate || 0) * 100;
      const fee = data.avgSubscriptionFee || 0;
      score += clamp(subs / 50, 0, 15);
      score += clamp((churn - 2) * 2, 0, 20); // churn alto aumenta potencial
      score += clamp(fee / 50, 0, 10);
      break;
    }
    case 'products': {
      const weeklyLost = data.weeklyLostSalesLocal || 0;
      const aov = data.avgOrderValueLocal || 0;
      const repetitive = data.repetitiveQuestionsLocal;
      score += clamp(weeklyLost * (aov / 100), 0, 20); // perdas semanais ponderadas
      score += repetitive === 'constant' ? 15 : repetitive === 'sometimes' ? 8 : 2;
      break;
    }
  }

  // Fatores comuns
  const comm = data.manualCommHours;
  if (comm === '>3') score += 12; else if (comm === '1-3') score += 6; else if (comm === '<1') score += 2;
  if (data.offHoursResponse === 'undefined' || data.offHoursResponse === 'manual_next_day') score += 10;
  if (data.reviewRequestProcess === 'inactive' || data.clientReengagementProcess === 'inactive') score += 6;

  return clamp(Math.round(score), 0, 100);
}

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
  const baseline = computeBaseline(data);
  let businessSpecifics = '';
  switch (data.businessType) {
    case 'appointment_services': {
      const noShowLoss = (data.monthlyAppointments || 0) * (data.noShowRate || 0) * (data.ticketPrice || 0);
      businessSpecifics = `
- Modelo: Serviços com Agendamento
- Volume de Agendamentos/mês: ${data.monthlyAppointments || 'N/A'}
- Taxa de No-Show: ${data.noShowRate ? (data.noShowRate * 100).toFixed(0) + '%' : 'N/A'}
- Ticket Médio: R$ ${data.ticketPrice || 'N/A'}
- Prejuízo Mensal com No-Show: R$ ${noShowLoss.toFixed(2)}
`;
      break;
    }
    case 'quote_services': {
      const lostRevenue = (data.monthlyQuotes || 0) * (1 - (data.quoteConversionRate || 0)) * (data.avgDealValue || 0);
      businessSpecifics = `
- Modelo: Serviços por Orçamento
- Orçamentos/mês: ${data.monthlyQuotes || 'N/A'}
- Taxa de Conversão: ${data.quoteConversionRate ? (data.quoteConversionRate * 100).toFixed(0) + '%' : 'N/A'}
- Valor Médio: R$ ${data.avgDealValue || 'N/A'}
- Receita Potencial Perdida: R$ ${lostRevenue.toFixed(2)}/mês
`;
      break;
    }
    case 'recurring_services': {
      const churnLoss = (data.activeSubscribers || 0) * (data.monthlyChurnRate || 0) * (data.avgSubscriptionFee || 0);
      businessSpecifics = `
- Modelo: Serviços Recorrentes
- Assinantes: ${data.activeSubscribers || 'N/A'}
- Churn Mensal: ${data.monthlyChurnRate ? (data.monthlyChurnRate * 100).toFixed(0) + '%' : 'N/A'}
- Mensalidade Média: R$ ${data.avgSubscriptionFee || 'N/A'}
- Prejuízo Mensal com Churn: R$ ${churnLoss.toFixed(2)}
- Engajamento: ${formatMemberEngagementProcess(data.memberEngagementProcess)}
`;
      break;
    }
    case 'products': {
      const weeklyLostSales = data.weeklyLostSalesLocal || 0;
      const avgOrderValue = data.avgOrderValueLocal || 0;
      const monthlyLostRevenue = weeklyLostSales * avgOrderValue * 4.33;
      businessSpecifics = `
- Modelo: Venda de Produtos (Negócio Local)
- Ticket Médio: R$ ${avgOrderValue.toFixed(2)}
- Vendas perdidas/semana: ${weeklyLostSales}
- Prejuízo Mensal Atendimento: R$ ${monthlyLostRevenue.toFixed(2)}
- Perguntas Repetitivas: ${formatRepetitiveQuestionsLocal(data.repetitiveQuestionsLocal)}
- Encomendas/Retirada: ${formatLocalOrderProcess(data.localOrderProcess)}
- Promoções/Novidades: ${formatPromotionCommunication(data.promotionCommunication)}
`;
      break;
    }
  }

  return `
Você é o NEXUS, um super-analista de negócios de IA. Gere um diagnóstico estratégico em JSON ESTRITO no schema abaixo, baseado nos dados.

REGRA PARA PONTUAÇÃO:
- Use o campo baselineScore=${'${baseline}'} como referência determinística calculada pelos KPIs.
- Calcule potentialTransformationScore em torno do baselineScore com variação máxima de ±10 pontos, mantendo no intervalo [0,100]. Seja criterioso: ajuste para cima se os problemas forem críticos; para baixo se os riscos forem menores.

Schema:
{
  "type": "object",
  "properties": {
    "potentialTransformationScore": { "type": "number" },
    "potentialEconomy": { "type": "string" },
    "timeRecovered": { "type": "string" },
    "productivityGain": { "type": "string" },
    "implementationTimeframe": { "type": "string" },
    "executiveSummary": { "type": "string" },
    "solutions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "description": { "type": "string" },
          "impact": { "type": "string", "enum": ["Alto","Médio","Baixo"] },
          "implementationTime": { "type": "string" },
          "expectedROI": { "type": "string" },
          "benefits": { "type": "array", "items": { "type": "string" } },
          "detailedExplanation": { "type": "string" }
        },
        "required": ["title","description","impact","implementationTime","expectedROI","benefits","detailedExplanation"]
      }
    }
  },
  "required": ["potentialTransformationScore","potentialEconomy","timeRecovered","productivityGain","implementationTimeframe","executiveSummary","solutions"]
}

Dados do negócio:
- Nome do Contato: ${data.userName || 'N/A'}
- Nome da Empresa: ${data.companyName || 'N/A'}
- E-mail: ${data.email || 'N/A'}
- baselineScore: ${baseline}

Específicos:
${businessSpecifics}

Comuns:
- Horas em comunicação manual/dia: ${data.manualCommHours || 'N/A'}
- Resposta fora do horário: ${formatOffHoursResponse(data.offHoursResponse)}
- Solicitação de avaliações: ${formatReviewProcess(data.reviewRequestProcess)}
- Reengajamento de clientes antigos: ${formatReengagementProcess(data.clientReengagementProcess)}

Responda APENAS com JSON válido conforme o schema, sem texto extra.
`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).send('OPENAI_API_KEY não configurada');
      return;
    }
    const { data } = req.body as { data: DiagnosisData };
    if (!data) {
      res.status(400).send('Corpo inválido: esperado { data }');
      return;
    }

    const baseline = computeBaseline(data);

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um analista de negócios de IA. Responda APENAS em JSON válido no schema fornecido.' },
        { role: 'user', content: buildPrompt(data) }
      ],
      response_format: { type: 'json_object' }
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(raw) as DiagnosisResult;

    // Ajuste final: clamp ao redor do baseline e [0..100]
    let score = Number(result.potentialTransformationScore);
    if (!Number.isFinite(score)) score = baseline;
    score = Math.round(score);
    score = clamp(score, baseline - 10, baseline + 10);
    score = clamp(score, 0, 100);
    result.potentialTransformationScore = score;

    res.status(200).json(result);
  } catch (err: any) {
    console.error('OpenAI error', err);
    res.status(500).send(err?.message || 'Erro ao gerar diagnóstico');
  }
}