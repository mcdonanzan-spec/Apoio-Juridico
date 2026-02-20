
import { GoogleGenAI } from "@google/genai";
import { LegalAnalysisInput } from "../types";

export const analyzeLegalDocument = async (input: LegalAnalysisInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
Aja como um Assistente Jurídico Corporativo expert em direito brasileiro, focado em construção civil e incorporação.
Sua tarefa é analisar o documento jurídico anexo (ou texto fornecido) com rigor técnico e foco em mitigação de riscos para a empresa representada.

DADOS DE CONTEXTO:
- Empresa: ${input.empresa} (CNPJ: ${input.cnpj})
- Papel: ${input.papel}
- Objetivo: ${input.objetivo}
- Valor: ${input.valor}
- Urgência: ${input.urgencia}
- Preocupações Específicas: ${input.preocupacoes}

DIRETRIZES:
1. Analise cada cláusula sob a ótica do Código Civil, CLT, Lei 4.591/64 e jurisprudência.
2. Identifique armadilhas contratuais (cláusulas leoninas, multas desproporcionais).
3. Calcule o score de risco (0-100) baseado no impacto financeiro e jurídico.
`;

  const promptText = `
Por favor, realize a análise completa do documento conforme as instruções do sistema.
Considere as informações de multas (${input.multa}), prazos (${input.prazo}) e garantias (${input.garantia}) informadas pelo usuário como pontos de partida para a conferência.

Retorne EXCLUSIVAMENTE o relatório no formato Markdown estruturado:
# RELATÓRIO EXECUTIVO
## Identificação do Documento
## Resumo Executivo
## Score Numérico (0-100)
## Classificação Qualitativa
## Top 5 Riscos Identificados
## Exposição Financeira Estimada (Máxima e Provável)
## Recomendações Estratégicas Objetivas

# ANEXO TÉCNICO
## Análise Estruturada por Cláusula
## Fundamentação Legal Brasileira Aplicável
## Sugestões de Redação Alternativa
## Cláusulas Ausentes ou Fragilidades

# DECLARAÇÃO FINAL
Esta análise constitui apoio técnico automatizado e não substitui parecer jurídico formal.
`;

  const parts: any[] = [{ text: promptText }];

  // If a file was uploaded, add it as a multimodal part
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
      temperature: 0.1, // High precision
      thinkingConfig: { thinkingBudget: 8000 } // Extended thinking for complex legal docs
    },
  });

  return response.text || "Erro ao processar análise.";
};
