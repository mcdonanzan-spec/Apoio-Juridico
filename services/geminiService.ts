
import { GoogleGenAI } from "@google/genai";
import { LegalAnalysisInput } from "../types";

export const analyzeLegalDocument = async (input: LegalAnalysisInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
Você é um Auditor Jurídico Sênior especializado em Gestão de Riscos para o Setor de Engenharia Civil Brasileira.
Sua missão é proteger a ${input.empresa} através de uma análise técnica, cética e extremamente realista.

DIRETRIZES DE RIGOR TÉCNICO:
1. CONSISTÊNCIA: Use temperatura zero. O score deve ser matemático e justificável.
2. RIGOR FINANCEIRO: Contratos de PMG sem "CAP" (limite) de prejuízo ou sem reajuste trimestral/semestral devem ser penalizados severamente no Score Financeiro.
3. RIGOR TRABALHISTA: Qualquer dubiedade sobre responsabilidade por terceirizados deve elevar o risco.

MATRIZ DE CÁLCULO OBRIGATÓRIA (Use esta exata proporção):
- Risco Financeiro (30%): Avalie multas, fluxo de caixa, PMG e reajustes.
- Risco Trabalhista (25%): Avalie obrigações subsidiárias e segurança.
- Risco Jurídico Estrutural (20%): Avalie foro, rescisão e validade de cláusulas.
- Risco Operacional (15%): Avalie prazos, escopo e penalidades de medição.
- Risco Estratégico (10%): Avalie exclusividade e reputação.

Para cada categoria acima, você deve atribuir uma nota de 0 a 100 antes de calcular a média ponderada final.
`;

  const promptText = `
Analise o documento e gere o relatório seguindo esta estrutura:

# RELATÓRIO EXECUTIVO

## Ficha Resumo do Instrumento
(9 pontos obrigatórios conforme solicitado pela advogada)

## Dashboard de Riscos Ponderados
(Apresente assim):
- [FINANCEIRO]: (Nota)/100 (Peso 30%)
- [TRABALHISTA]: (Nota)/100 (Peso 25%)
- [ESTRUTURAL]: (Nota)/100 (Peso 20%)
- [OPERACIONAL]: (Nota)/100 (Peso 15%)
- [ESTRATÉGICO]: (Nota)/100 (Peso 10%)

- **Score Final Consolidado**: (Média Ponderada)/100
- **Classificação**: (Baixo/Médio/Alto/Crítico)

## Justificativa Técnica do Cálculo
(Explique por que cada nota de categoria foi escolhida. Seja específico sobre as cláusulas que elevaram o risco.)

## Resumo Analítico da IA
## Top 5 Riscos e Exposição Financeira

# ANEXO TÉCNICO
## Análise Estruturada por Cláusula
## Sugestões de Redação Alternativa
## Cláusulas Ausentes ou Fragilidades

# DECLARAÇÃO FINAL
Esta análise constitui apoio técnico automatizado e não substitui parecer jurídico formal.
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
      temperature: 0, // Determinismo total para evitar flutuações
      thinkingConfig: { thinkingBudget: 15000 }
    },
  });

  return response.text || "Erro ao processar análise.";
};
