
import { GoogleGenAI } from "@google/genai";
import { LegalAnalysisInput } from "../types";

export const analyzeLegalDocument = async (input: LegalAnalysisInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
Aja como um Auditor Jurídico de Pré-Análise da Unità Engenharia.
Seu objetivo é extrair dados brutos e apontar riscos imediatos para a diretoria.

REGRAS DE ESTILO:
- Linguagem de Engenharia: Direta, sem "juridiquês" desnecessário.
- Formato de Ficha: Use tópicos curtos.
- Sem explicações de cálculo: Apenas forneça o score final baseado no risco para a Unità.

CRITÉRIOS DE RISCO:
- Risco Alto: PMG sem limite de estouro, retenções acima de 5%, prazos de pagamento > 30 dias, ausência de reajuste.
- Risco Baixo: Cláusulas de reequilíbrio claras, prazos de medição curtos, multas limitadas a 10%.
`;

  const promptText = `
Gere a análise técnica seguindo esta estrutura rigorosa:

# FICHA RESUMO DO CONTRATO
- **Obra**: (Nome da obra)
- **Contratante**: (Empresa contratante)
- **Valor do Contrato**: (Valor total e taxas)
- **Forma de Pagamento**: (Gatilhos de medição)
- **Prazo para Aprovação da Medição**: (X dias)
- **Prazo para Pagamento**: (X dias)
- **Retenção de Garantia**: (X% e liberação)
- **Prazo de Execução**: (Meses/Dias)
- **Escopo Principal**: (Resumo operacional)
- **Penalidades**: (Multas por atraso/descumprimento)

## ANÁLISE DE EXPOSIÇÃO
- **Índice de Exposição**: (0-100)
- **Classificação**: (Baixo, Médio, Alto ou Crítico)

## PRINCIPAIS RISCOS IDENTIFICADOS (PRÉ-AUDITORIA)
- Liste de 3 a 5 pontos de atenção imediata.

## SUGESTÕES DE AJUSTE (REDAÇÃO)
- Indique o que o departamento jurídico deve renegociar.

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
      thinkingConfig: { thinkingBudget: 10000 }
    },
  });

  return response.text || "Erro ao processar análise.";
};
