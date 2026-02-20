
export interface LegalAnalysisInput {
  empresa: string;
  cnpj: string;
  papel: string;
  tipoAnalise: string;
  objetivo: string;
  valor: string;
  prazo: string;
  garantia: string;
  multa: string;
  preocupacoes: string;
  urgencia: string;
  documentoTexto?: string;
  arquivo?: {
    data: string;
    mimeType: string;
    name: string;
  };
}

export interface RiskCategory {
  nome: string;
  peso: number;
  score: number;
  descricao: string;
}

export interface AnalysisResult {
  relatorioExecutivo: {
    identificacao: string;
    resumo: string;
    scoreNumerico: number;
    classificacaoQualitativa: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
    topRiscos: string[];
    exposicaoFinanceira: {
      maxima: string;
      provavel: string;
    };
    recomendacoes: string[];
  };
  anexoTecnico: {
    analiseClausulas: Array<{
      clausula: string;
      analise: string;
      fundamentacao: string;
      sugestaoRedacao: string;
    }>;
    fragilidades: string[];
  };
}
