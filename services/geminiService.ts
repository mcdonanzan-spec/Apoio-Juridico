
import { GoogleGenAI } from "@google/genai";
import { LegalAnalysisInput } from "../types";

export const analyzeLegalDocument = async (input: LegalAnalysisInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
Você é o Auditor Jurídico Chefe da Unità Engenharia. Sua missão é realizar uma Pré-Auditoria técnica e padronizada.
Você deve buscar no contrato as respostas para as perguntas fundamentais do modelo de Ficha Resumo da Unità.

DIRETRIZES DE EXTRAÇÃO:
- Se uma informação não for encontrada, escreva "Não identificado no documento".
- Cite a cláusula sempre que possível (Ex: Cláusula 5.2).
- Mantenha o tom executivo: direto, técnico e focado em riscos financeiros/operacionais.

MATRIZ DE SCORE (PARA O ÍNDICE DE EXPOSIÇÃO):
- 0-30: Baixa Exposição (Contrato equilibrado).
- 31-60: Média Exposição (Pontos de atenção moderados).
- 61-85: Alta Exposição (Cláusulas abusivas ou falta de garantias).
- 86-100: Exposição Crítica (Risco severo de prejuízo ou inadimplemento).
`;

  const promptText = `
Analise o documento jurídico fornecido e preencha a FICHA RESUMO conforme o padrão Unità Engenharia abaixo:

# FICHA RESUMO DO CONTRATO
- **Objeto dos Serviços**: (Descreva a execução completa dos serviços, projetos e cronograma)
- **Valor do Contrato**: (Valor total por extenso e numeral + Taxas de Administração/Adicionais)
- **Forma de Pagamento**: (Gatilhos de medição, remuneração e cláusula correspondente)
- **Prazo para Aprovação da Medição**: (Tempo máximo para o cliente aprovar)
- **Prazo para Pagamento**: (Data/dia útil para o desembolso após aprovação)
- **Documentação Necessária**: (NF, relatórios, certidões exigidas)
- **Retenção de Garantia**: (% retido, finalidade e condição de liberação)
- **Prazo de Execução**: (Duração total e tolerâncias)
- **Data de Início / Previsão de Término**: (Datas específicas ou marcos iniciais)

## ESCOPO PRINCIPAL / ATIVIDADES CONTRATADAS
(Liste as principais obrigações técnicas como execução, provisão de recursos, seguros e conformidade legal)

## RESPONSABILIDADES ESPECÍFICAS
(Foque em correção de vícios, prazos de garantia de 5 anos e obrigações de relatórios)

## PENALIDADES POR DESCUMPRIMENTO
(Liste multas por atraso, não conformidade técnica, auditorias de segurança e multas rescisórias)

## ANÁLISE DE EXPOSIÇÃO E ADITIVOS
- **Principais Alterações (Aditivos)**: (Se houver aditivo, liste mudanças em segurança ou rescisão)
- **Índice de Exposição**: (0-100)
- **Classificação**: (Baixo, Médio, Alto ou Crítico)

## OBSERVAÇÕES IMPORTANTES (PRÉ-AUDITORIA)
- (Destaque o ponto mais crítico que exige atenção imediata do jurídico)

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
    parts.push({ text: `CONTEÚDO DO DOCUMENTO PARA ANÁLISE:\n${input.documentoTexto}` });
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
