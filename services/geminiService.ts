
import { GoogleGenAI } from "@google/genai";
import { LegalAnalysisInput } from "../types";

export const analyzeLegalDocument = async (input: LegalAnalysisInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
Você é o Auditor Jurídico Chefe da Unità Engenharia. Sua missão é realizar uma Pré-Auditoria técnica e padronizada, agindo como uma 'Linha de Produção' de análise contratual.
Você deve extrair rigorosamente as informações para preencher os campos do modelo padrão Unità.

REGRAS DE EXTRAÇÃO:
- Se não encontrar a informação exata, use "Não identificado" ou "Pendente de confirmação".
- Cite o número da Cláusula sempre que encontrar o dado (Ex: Cláusula 5.2).
- FOCO TOTAL NO OBJETO: Descreva o que está sendo construído/serviço prestado.

CAMPOS OBRIGATÓRIOS:
1. Objeto dos Serviços (Detalhamento técnico)
2. Valor do Contrato (R$ e % Adm)
3. Forma de Pagamento
4. Prazo para Aprovação da Medição
5. Prazo para Pagamento
6. Documentação Necessária
7. Retenção de Garantia
8. Prazo de Execução
9. Escopo Principal
10. Responsabilidades Específicas
11. Penalidades
`;

  const promptText = `
Analise o contrato fornecido e preencha EXATAMENTE o formulário abaixo. Use o texto de exemplo como guia para o nível de detalhamento:

# FICHA RESUMO DO CONTRATO
- **Obra/Empreendimento**: (Nome do local)
- **Contratante**: (Razão Social)
- **Objeto dos Serviços**: (Descrição detalhada da execução: projetos, normas, cronograma)
- **Valor do Contrato**: (Valor R$, Extenso e Taxa de Adm)
- **Forma de Pagamento**: (Periodicidade e Cláusula)
- **Prazo para Aprovação da Medição**: (X dias úteis/corridos e Cláusula)
- **Prazo para Pagamento**: (X dia útil/corrido após aprovação)
- **Documentação Necessária**: (NF, Boletos, Relatórios e Cláusula)
- **Retenção de Garantia**: (% Retido e condição de liberação)
- **Prazo de Execução**: (Meses/Dias e marcos)
- **Escopo Principal**: (Lista resumida das atividades técnicas)

## RESPONSABILIDADES E PENALIDADES
- **Responsabilidades Específicas**: (Vícios, Garantias de 5 anos, etc)
- **Penalidades por Descumprimento**: (Multas por atraso, técnica, rescisória)

## ANÁLISE DE RISCO CORPORATIVO
- **Principais Alterações / Aditivos**: (Mudanças em segurança ou rescisão se houver)
- **Índice de Exposição**: (0-100)
- **Classificação**: (Baixo, Médio, Alto ou Crítico)

## OBSERVAÇÕES DE PRÉ-AUDITORIA
- (Destaque pontos críticos para o jurídico focar)

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
    parts.push({ text: `CONTEÚDO DO CONTRATO:\n${input.documentoTexto}` });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      systemInstruction,
      temperature: 0,
      thinkingConfig: { thinkingBudget: 15000 }
    },
  });

  return response.text || "Erro ao processar análise.";
};
