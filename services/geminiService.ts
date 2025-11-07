import type { DiagnosisResult, DiagnosisData } from '../types';

// Cliente fino que chama o endpoint serverless OpenAI
export const getDiagnosis = async (data: DiagnosisData): Promise<DiagnosisResult> => {
  const res = await fetch('/api/diagnosis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Falha ao gerar diagnóstico (HTTP ${res.status}).`);
  }

  return await res.json() as DiagnosisResult;
};