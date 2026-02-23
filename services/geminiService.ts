
import { GoogleGenAI } from "@google/genai";
import { LegalAnalysisInput } from "../types";

export const analyzeLegalDocument = async (input: LegalAnalysisInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
Você é um Auditor Jurídico de Engenharia e Incorporação. Sua missão é produzir uma FICHA RESUMO técnica, inspirada em padrões de diretoria de construtoras (como a Unità Engenharia).

REGRAS DE OURO:
1. SUCINTO E PRÁTICO: Evite parágrafos longos. Use listas e frases diretas.
2. FOCO NO NEGÓCIO: Identifique valores, prazos e multas imediatamente.
3. CONSISTÊNCIA (TEMP 0): O score deve ser repetível e matemático.

MATRIZ DE CÁLCULO REALISTA:
Cada pilar abaixo recebe uma nota de 0 a 100:
- FINANCEIRO (30%): PMG sem limite (CAP), ausência de reajuste = Nota 90+.
- TRABALHISTA (25%): Responsabilidade ilimitada, falta de seguro = Nota 80+.
- ESTRUTURAL (20%): Foro distante, rescisão sem aviso = Nota 70+.
- OPERACIONAL (15%): Prazos irreais, retenção de garantia abusiva = Nota 60+.
- ESTRATÉGICO (10%): Exclusividade, multas de rescisão altas = Nota 50+.

O Score Final é a média ponderada. 
- 0-25: Excelente (Risco Baixo).
- 26-50: Aceitável com ressalvas (Risco Médio).
- 51-75: Perigoso (Risco Alto).
- 76-100: Inviável (Risco Crítico).
`;

  const promptText = `
Com base no documento anexo, gere uma análise executiva de no máximo 3 páginas conceituais.

# FICHA RESUMO DO INSTRUMENTO
1. Objeto dos Serviços: (Seja direto)
2. Valor do Contrato: (Valor total + impostos/taxas)
3. Forma de Pagamento: (Gatilhos e prazos)
4. Prazo de Execução: (Duração em meses/dias)
5. Data de Início e Término: (Datas ou condições suspensivas)
6. Escopo Principal/Atividades: (Principais entregas)
7. Responsabilidades: (Contratada vs Contratante)
8. Penalidades por Descumprimento: (Multas e retenções)
9. Observação Importante: (O risco "escondido" no contrato)

## DASHBOARD DE RISCO TÉCNICO
- [FINANCEIRO]: (Nota)/100
- [TRABALHISTA]: (Nota)/100
- [ESTRUTURAL]: (Nota)/100
- [OPERACIONAL]: (Nota)/100
- [ESTRATÉGICO]: (Nota)/100

- **Score Final Consolidado**: (Média)/100
- **Classificação**: (Baixo/Médio/Alto/Crítico)

## SÍNTESE DE RISCOS E RECOMENDAÇÕES (O QUE MUDAR?)
- Liste os 3 pontos mais críticos e como renegociar a redação de forma sucinta.

# DECLARAÇÃO FINAL
Análise automatizada baseada em legislação brasileira. Não substitui parecer jurídico formal.
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
      thinkingConfig: { thinkingBudget: 15000 }
    },
  });

  return response.text || "Erro ao processar análise.";
};
