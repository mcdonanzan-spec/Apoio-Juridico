import { LegalAnalysisInput, StructuredAnalysisResult, ChatMessage } from '../types';

export const analyzeLegalDocument = async (input: LegalAnalysisInput): Promise<StructuredAnalysisResult> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorDetail = 'Erro ao processar análise no servidor.';
    try {
      const errJson = await response.json();
      if (errJson.error) {
        const details = errJson.details || '';
        if (
          details.includes('503') ||
          details.includes('high demand') ||
          details.includes('UNAVAILABLE') ||
          details.includes('RESOURCE_EXHAUSTED')
        ) {
          errorDetail =
            'A rede da IA está sob pico momentâneo de demanda. O sistema alternou modelos de contingência. Por favor, clique em Tentar Novamente para concluir a auditoria.';
        } else if (errJson.details) {
          errorDetail = `${errJson.error}: ${errJson.details}`;
        } else {
          errorDetail = errJson.error;
        }
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const data: StructuredAnalysisResult = await response.json();
  return data;
};

export const sendChatQuestion = async (
  question: string,
  documentContext: string,
  previousSummary: string,
  history: ChatMessage[]
): Promise<string> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      documentContext,
      previousSummary,
      history,
    }),
  });

  if (!response.ok) {
    let errorDetail = 'Erro na comunicação com o assistente jurídico.';
    try {
      const errJson = await response.json();
      if (errJson.error) {
        const details = errJson.details || '';
        if (
          details.includes('503') ||
          details.includes('high demand') ||
          details.includes('UNAVAILABLE')
        ) {
          errorDetail = 'Instabilidade temporária nos servidores. Por favor, reenvie sua pergunta.';
        } else {
          errorDetail = errJson.details ? `${errJson.error}: ${errJson.details}` : errJson.error;
        }
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const data = await response.json();
  return data.answer || '';
};
