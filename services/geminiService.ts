
import { GoogleGenAI } from "@google/genai";
import { LegalAnalysisInput } from "../types";

export const analyzeLegalDocument = async (input: LegalAnalysisInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
Aja como um Auditor Jurídico de Pré-Análise da Unità Engenharia.
Seu objetivo é extrair dados brutos e apontar riscos imediatos para a diretoria de forma limpa.

REGRAS DE FORMATAÇÃO PARA O LAYOUT:
- Não use títulos de nível 1 (#). Use apenas nível 2 (##) para seções.
- Mantenha as descrições dos campos da Ficha Resumo curtas.
- Para "Principais Riscos", use uma lista simples com "- ".
- O "Score Final" deve ser um número entre 0 e 100 sem texto adicional na mesma linha.

CRITÉRIOS DE RISCO:
- Risco Crítico/Alto (70-100): PMG sem teto, Multas abusivas, Retenções > 5%, Prazos de pagamento > 30 dias.
- Risco Médio (30-70): Prazos de medição longos, falta de indexador de reajuste claro.
- Risco Baixo (0-30): Contrato equilibrado com CAP de responsabilidade e reajuste mensal.
`;

  const promptText = `
Analise o documento e gere a Ficha Resumo Técnica para pré-auditoria:

# FICHA RESUMO DO CONTRATO
- **Obra**: (Nome curto da obra)
- **Contratante**: (Razão Social)
- **Valor do Contrato**: (Valor total e taxas)
- **Forma de Pagamento**: (Condição principal)
- **Prazo para Aprovação da Medição**: (Dias úteis)
- **Prazo para Pagamento**: (Dias úteis)
- **Retenção de Garantia**: (Valor % e condição)
- **Prazo de Execução**: (Meses/Dias)
- **Escopo Principal**: (Atividade em 1 frase)
- **Penalidades**: (Resumo das multas principais)

## ANÁLISE DE EXPOSIÇÃO
- **Índice de Exposição**: (Apenas o número)
- **Classificação**: (Baixo, Médio, Alto ou Crítico)

## PRINCIPAIS RISCOS IDENTIFICADOS (PRÉ-AUDITORIA)
- (Ponto de atenção 1)
- (Ponto de atenção 2)
- (Ponto de atenção 3)

## SUGESTÕES DE AJUSTE (REDAÇÃO)
- (Sugestão de alteração de cláusula 1)
- (Sugestão de alteração de cláusula 2)

# AVISO LEGAL
Esta análise constitui apoio técnico automatizado para pré-auditoria e não substitui parecer jurídico formal.
`;

  const parts: any[] = [{ text: promptText }];

  if (input.arquivo) {
    parts.push({
      inlineData: {
        data: input.arquivo.data,
        mimeType: input.arquivo.mimeType
      }
    });
  } else if (input.documentoTexto) {
    parts.push({ text: `CONTEÚDO DO DOCUMENTO:\n${input.documentoTexto}` });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      systemInstruction,
      temperature: 0,
      thinkingConfig: { thinkingBudget: 8000 }
    },
  });

  return response.text || "Erro ao processar análise.";
};
