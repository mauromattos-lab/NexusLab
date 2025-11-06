import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import type { DiagnosisData, DiagnosisResult } from '../types';

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function computeBaseline(data: DiagnosisData): number {
  let score = 50;
  const c = (n: number, a: number, b: number) => clamp(n, a, b);
  switch (data.businessType) {
    case 'appointment_services': {
      const appts = data.monthlyAppointments || 0;
      const noShow = (data.noShowRate || 0) * 100;
      const ticket = data.ticketPrice || 0;
      score += c(appts / 10, 0, 20);
      score += c((noShow - 5) / 2, 0, 15);
      score += c(ticket / 100, 0, 10);
      break;
    }
    case 'quote_services': {
      const quotes = data.monthlyQuotes || 0;
      const conv = (data.quoteConversionRate || 0) * 100;
      const deal = data.avgDealValue || 0;
      score += c(quotes / 5, 0, 15);
      score += c((50 - conv) / 3, 0, 15);
      score += c(deal / 2000, 0, 10);
      break;
    }
    case 'recurring_services': {
      const subs = data.activeSubscribers || 0;
      const churn = (data.monthlyChurnRate || 0) * 100;
      const fee = data.avgSubscriptionFee || 0;
      score += c(subs / 50, 0, 15);
      score += c((churn - 2) * 2, 0, 20);
      score += c(fee / 50, 0, 10);
      break;
    }
    case 'products': {
      const weeklyLost = data.weeklyLostSalesLocal || 0;
      const aov = data.avgOrderValueLocal || 0;
      const repetitive = data.repetitiveQuestionsLocal;
      score += c(weeklyLost * (aov / 100), 0, 20);
      score += repetitive === 'constant' ? 15 : repetitive === 'sometimes' ? 8 : 2;
      break;
    }
  }
  const comm = data.manualCommHours;
  if (comm === '>3') score += 12; else if (comm === '1-3') score += 6; else if (comm === '<1') score += 2;
  if (data.offHoursResponse === 'undefined' || data.offHoursResponse === 'manual_next_day') score += 10;
  if (data.reviewRequestProcess === 'inactive' || data.clientReengagementProcess === 'inactive') score += 6;
  return clamp(Math.round(score), 0, 100);
}

function buildPrompt(data: DiagnosisData): string {
  const baseline = computeBaseline(data);
  // Prompt reduzido; use o mesmo conteúdo do api/diagnosis.ts se quiser 100% idêntico
  return `
Você é o NEXUS, um super-analista de negócios de IA. Gere um diagnóstico em JSON no schema especificado.

REGRA P/ PONTUAÇÃO:
- baselineScore=${baseline}
- Ajuste em torno do baseline em ±10 (range [0,100]).

Schema esperado:
{
  "potentialTransformationScore": number,
  "potentialEconomy": string,
  "timeRecovered": string,
  "productivityGain": string,
  "implementationTimeframe": string,
  "executiveSummary": string,
  "solutions": [{
    "title": string,
    "description": string,
    "impact": "Alto" | "Médio" | "Baixo",
    "implementationTime": string,
    "expectedROI": string,
    "benefits": string[],
    "detailedExplanation": string
  }]
}

Dados do negócio (resumo):
- businessType: ${data.businessType}
- baselineScore: ${baseline}
  `;
}

const app = express();
app.use(express.json());

app.post('/api/diagnosis', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).send('OPENAI_API_KEY não configurada');

    const { data } = req.body as { data: DiagnosisData };
    if (!data) return res.status(400).send('Corpo inválido: esperado { data }');

    const baseline = computeBaseline(data);
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um analista de negócios de IA. Responda APENAS em JSON válido.' },
        { role: 'user', content: buildPrompt(data) }
      ],
      response_format: { type: 'json_object' }
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(raw) as DiagnosisResult;

    let score = Number(result.potentialTransformationScore);
    if (!Number.isFinite(score)) score = baseline;
    score = Math.round(score);
    score = clamp(score, baseline - 10, baseline + 10);
    score = clamp(score, 0, 100);
    result.potentialTransformationScore = score;

    res.json(result);
  } catch (err: any) {
    console.error('[dev-api] error', err?.message);
    res.status(500).send(err?.message || 'Erro ao gerar diagnóstico');
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`[dev-api] Listening on http://localhost:${PORT}`);
});