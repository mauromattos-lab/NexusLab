import { createClient } from '@supabase/supabase-js';
import type { DiagnosisResult, DiagnosisData } from '../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase URL ou Chave anônima não foram definidas. O salvamento de leads está desativado.");
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Salva um lead (e-mail, dados de diagnóstico e resultado da IA) no banco de dados do Supabase.
 * Assume uma tabela chamada `leads` com as colunas `email` (text) e `diagnosis_data` (jsonb).
 * @param leadData Os dados coletados do usuário durante o chat.
 * @param diagnosisResult O objeto de resultado do diagnóstico gerado pela IA.
 */
export const saveLead = async (leadData: DiagnosisData, diagnosisResult: DiagnosisResult): Promise<void> => {
    if (!supabase || !leadData.email) {
        console.log("Supabase não configurado ou e-mail não fornecido. Pulando o salvamento do lead.");
        return;
    }
    
    try {
        const { error } = await supabase
            .from('leads')
            .insert([
                {
                    email: leadData.email,
                    diagnosis_data: {
                        collectedData: leadData,
                        aiResult: diagnosisResult,
                    },
                },
            ]);

        if (error) {
            throw error;
        }

        console.log("Lead salvo com sucesso no Supabase.");

    } catch (error) {
        console.error("Erro ao salvar lead no Supabase:", error);
        // Não lançamos o erro para não quebrar a experiência do usuário.
        // O erro será visível no console para depuração.
    }
};
