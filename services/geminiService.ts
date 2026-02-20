
import { GoogleGenAI } from "@google/genai";
import { LegalAnalysisInput } from "../types";

export const analyzeLegalDocument = async (input: LegalAnalysisInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
Aja como um Assistente Jurídico Corporativo expert em direito brasileiro, focado em construção civil e incorporação.
Sua tarefa é analisar o documento jurídico com rigor técnico para mitigação de riscos.

LÓGICA DE CÁLCULO DO SCORE (METODOLOGIA):
O score final (0-100) deve ser a média ponderada das seguintes categorias:
1. Risco Financeiro (Peso 30%): Exposição a multas, falta de reajuste, juros abusivos.
2. Risco Trabalhista (Peso 25%): Responsabilidade solidária/subsidiária, encargos, segurança do trabalho.
3. Risco Jurídico Estrutural (Peso 20%): Validade de cláusulas, foro, competência, vícios de forma.
4. Risco Operacional (Peso 15%): Prazos irreais, falta de escopo definido, penalidades de execução.
5. Risco Estratégico (Peso 10%): Cláusulas de exclusividade, rescisão imotivada, reputação.

CLASSIFICAÇÃO:
- 0–25 (Baixo): Documento equilibrado, riscos mitigados. (ALVO IDEAL)
- 26–50 (Médio): Pontos de atenção moderados, necessita ajustes pontuais.
- 51–75 (Alto): Cláusulas leoninas ou exposição financeira severa.
- 76–100 (Crítico): Inviabilidade jurídica ou risco de prejuízo imediato.

DADOS DE CONTEXTO DO USUÁRIO:
- Empresa Representada: ${input.empresa} (CNPJ: ${input.cnpj})
- Papel: ${input.papel}
- Objetivo: ${input.objetivo}
- Valor Informado: ${input.valor}
- Preocupações: ${input.preocupacoes}
`;

  const promptText = `
Realize a análise do documento anexo. O relatório deve seguir RIGOROSAMENTE esta estrutura Markdown:

# RELATÓRIO EXECUTIVO

## Ficha Resumo do Instrumento
(Extraia exatamente estes 9 pontos):
1. Objeto dos Serviços:
2. Valor do Contrato:
3. Forma de Pagamento:
4. Prazo de Execução:
5. Data de Início e Término:
6. Escopo Principal/Atividades:
7. Responsabilidades:
8. Penalidades por Descumprimento:
9. Observação Importante:

## Score de Risco e Metodologia
- Score Numérico: (0-100)
- Classificação: (Baixo/Médio/Alto/Crítico)
- Justificativa do Score: (Explique brevemente como os pesos de cada categoria influenciaram esta nota específica)

## Resumo Analítico da IA
(Síntese da saúde jurídica)

## Top 5 Riscos e Exposição Financeira
(Identifique os riscos e estime a exposição máxima e provável)

# ANEXO TÉCNICO
## Análise Estruturada por Cláusula
## Sugestões de Redação Alternativa
## Cláusulas Ausentes ou Fragilidades

# DECLARAÇÃO FINAL
Esta análise constitui apoio técnico automatizado baseado na legislação brasileira e não substitui parecer jurídico formal.
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
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 12000 }
    },
  });

  return response.text || "Erro ao processar análise.";
};
