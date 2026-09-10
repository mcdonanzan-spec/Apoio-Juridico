export interface OptionalParameters {
  empresa?: string;
  cnpj?: string;
  papel?: string; // Ex: Contratante, Contratada, Comprador, Vendedor, Sócio, etc.
  ramoNegocio?: string; // Ex: Construção Civil, Tecnologia, Comércio, Prestação de Serviços, M&A, etc.
  valor?: string;
  prazo?: string;
  garantia?: string;
  multa?: string;
  preocupacoes?: string;
  urgencia?: 'Normal' | 'Urgente' | 'Crítica';
  perfilAnalise?: 'Equilibrado & Negocial' | 'Defensivo & Blindagem' | 'Agressivo & Combate de Riscos';
}

export interface DocumentoCorroborativo {
  id: string;
  name: string;
  data?: string; // base64
  mimeType: string;
  size?: number;
  extractedText?: string;
  tipoLabel: string;
  descricao?: string; // ex: "Proposta Comercial", "Ata de Reunião", "Apresentação da Diretoria", "E-mail de alinhamento"
}

export interface LegalAnalysisInput {
  promptSimples: string;
  documentoTexto?: string;
  arquivo?: {
    name: string;
    data: string;
    mimeType: string;
    size?: number;
  };
  documentosCorroborativos?: DocumentoCorroborativo[];
  parametrosOpcionais?: OptionalParameters;
}

export interface ClausulaAnalise {
  numero: string;
  titulo: string;
  textoOriginal?: string;
  grauRisco: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  diagnostico: string;
  fundamentacaoLegal: string;
  redacaoSugerida: string;
}

export interface FundamentacaoItem {
  norma: string;
  aplicacao: string;
}

export interface StructuredAnalysisResult {
  titulo: string;
  resumoExecutivo: string;
  partesIdentificadas: string;
  scoreRisco: number;
  classificacaoRisco: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  principaisRiscos: string[];
  fundamentacaoDestaque: FundamentacaoItem[];
  clausulas: ClausulaAnalise[];
  estrategiaNegocial: string[];
  documentosCorroborativosAnalisados?: string[];
  cruzamentoCorroborativo?: string;
  relatorioMarkdownCompleto: string;
  versaoParecer?: number;
  ajustesRealizadosNaConversa?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'lawyer';
  text: string;
  timestamp: string;
}
