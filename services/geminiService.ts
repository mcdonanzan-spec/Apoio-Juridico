
import { GoogleGenAI } from "@google/genai";
import { LegalAnalysisInput } from "../types";

export const analyzeLegalDocument = async (input: LegalAnalysisInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
Aja como um Assistente Jurídico Corporativo expert em direito brasileiro, focado em construção civil e incorporação.
Sua tarefa é analisar o documento jurídico com rigor técnico para mitigação de riscos.

DIRETRIZES OBRIGATÓRIAS DE EXTRAÇÃO (FICHA RESUMO):
Você deve extrair e destacar no início do relatório os seguintes pontos:
1. Objeto dos Serviços: Descrição clara do que está sendo contratado.
2. Valor do Contrato: Valor total e unidades de medida, se houver.
3. Forma de Pagamento: Condições, gatilhos de medição e prazos de desembolso.
4. Prazo de Execução: Duração total do contrato.
5. Data de Início e Término: Datas explícitas ou condições para o início (ex: Ordem de Serviço).
6. Escopo Principal/Atividades: Lista sucinta das principais entregas.
7. Responsabilidades: Obrigações principais da Contratada e da Contratante.
8. Penalidades por Descumprimento: Multas moratórias, compensatórias e cláusulas de retenção.
9. Observação Importante: Qualquer ponto fora da curva ou risco atípico detectado.

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
(Apresente os 9 pontos de extração obrigatória aqui em formato de lista estruturada "Campo: Valor")

## Score de Risco e Classificação
- Score Numérico: (0-100)
- Classificação: (Baixo/Médio/Alto/Crítico)

## Resumo Analítico da IA
(Um parágrafo de síntese sobre a saúde jurídica do documento)

## Top 5 Riscos e Exposição Financeira
(Identifique os riscos e estime a exposição máxima e provável)

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
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 8000 }
    },
  });

  return response.text || "Erro ao processar análise.";
};
