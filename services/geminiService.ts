
import { GoogleGenAI } from "@google/genai";
import { LegalAnalysisInput } from "../types";

export const analyzeLegalDocument = async (input: LegalAnalysisInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
Aja como um Auditor Jurídico Sênior da Unità Engenharia. Sua tarefa é criar uma FICHA RESUMO DE CONTRATO ultra-objetiva para diretoria. 

ESTILO DE REDAÇÃO:
- Use tópicos (bullet points).
- Proibido parágrafos longos ou introduções prolixas.
- Foco em dados quantitativos (Valores, %, Prazos).

CRITÉRIOS DE SCORE (REALISTA E TÉCNICO):
- O score final (0-100) deve refletir a saúde financeira e operacional para a CONTRATADA.
- Itens que ELEVAM o risco (Score 70+): PMG sem teto, Multas > 10%, Ausência de reajuste inflacionário, Retenção de garantia > 5%.
- Itens que REDUZEM o risco (Score < 30%): Cláusulas de equilíbrio, prazos de pagamento curtos (<15 dias), Limitação de responsabilidade (CAP).

ESTRUTURA OBRIGATÓRIA:
1. FICHA RESUMO (Campos: Obra, Contratante, Valor, Adm %, Prazos de Medição/Pagamento, Retenção, Penalidades).
2. DASHBOARD DE RISCO (Financeiro, Trabalhista, Estrutural, Operacional, Estratégico).
3. PONTOS CRÍTICOS E SUGESTÕES (Apenas 3 a 5 pontos).
4. CLÁUSULAS AUSENTES.
`;

  const promptText = `
Analise o documento e gere a Ficha Resumo conforme o modelo Unità:

# FICHA RESUMO DO CONTRATO
- **Obra**: (Nome da obra/empreendimento)
- **Contratante**: (Razão Social e SPE)
- **Objeto**: (Descrição curta)
- **Valor do Contrato**: (Valor R$ + Taxa Adm %)
- **Forma de Pagamento**: (Ex: Mensal via medição)
- **Prazo de Aprovação da Medição**: (X dias úteis)
- **Prazo para Pagamento**: (X dia útil após medição)
- **Retenção de Garantia**: (X% e condição de liberação)
- **Prazo de Execução**: (Meses/Dias)
- **Escopo Principal**: (Resumo das atividades)
- **Penalidades**: (Liste multas por atraso e descumprimento)

## DASHBOARD DE RISCO TÉCNICO
- [FINANCEIRO]: (0-100)/100 (Peso 30%)
- [TRABALHISTA]: (0-100)/100 (Peso 25%)
- [ESTRUTURAL]: (0-100)/100 (Peso 20%)
- [OPERACIONAL]: (0-100)/100 (Peso 15%)
- [ESTRATÉGICO]: (0-100)/100 (Peso 10%)

- **Score Final Consolidado**: (Média Ponderada)/100
- **Classificação**: (Baixo/Médio/Alto/Crítico)

## ANÁLISE DE RISCO E RECOMENDAÇÕES
- (Descreva o risco mais grave e dê a sugestão de nova redação)

## CLÁUSULAS AUSENTES OU FRAGILIDADES
- (Liste o que falta para segurança da Unità)

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
      thinkingConfig: { thinkingBudget: 12000 }
    },
  });

  return response.text || "Erro ao processar análise.";
};
