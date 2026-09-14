import React, { useState, useCallback } from 'react';
import { LegalAnalysisInput, OptionalParameters, DocumentoCorroborativo } from '../types';
import { parseDocumentFile } from '../utils/docParser';
import { 
  FileText, 
  UploadCloud, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  SlidersHorizontal, 
  ShieldCheck, 
  Scale, 
  FileCheck2, 
  AlertTriangle,
  Building2,
  HelpCircle,
  FileCode,
  Paperclip,
  Plus,
  Presentation,
  CheckCircle2,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface AnalysisFormProps {
  onSubmit: (data: LegalAnalysisInput) => void;
  isLoading: boolean;
}

const QUICK_PROMPTS = [
  {
    icon: Layers,
    title: 'Confronto com Provas & Documentos Corroborativos',
    prompt: 'Confronte o documento principal com os documentos corroborativos anexados (.pdf, .doc, .ppt). Identifique contradições, promessas comerciais não refletidas na minuta, riscos e como as provas sustentam nossa tese jurídica.',
  },
  {
    icon: ShieldCheck,
    title: 'Auditoria de Riscos & Cláusulas Leoninas',
    prompt: 'Faça uma auditoria minuciosa deste documento: aponte cláusulas abusivas ou desequilibradas, riscos jurídicos e financeiros para minha empresa, e elabore sugestões de redação blindada para cada ponto crítico.',
  },
  {
    icon: Scale,
    title: 'Parecer Jurídico Fundamentado (CC & STJ)',
    prompt: 'Elabore um parecer jurídico executivo com sólida fundamentação no Código Civil, legislação brasileira aplicável e precedentes do STJ e STF, avaliando a validade das obrigações e penalidades.',
  },
  {
    icon: FileCheck2,
    title: 'Minuta de Contraproposta (Redlines)',
    prompt: 'Revise todas as cláusulas desfavoráveis e redija uma contraproposta completa com redações alternativas equilibradas e defensivas, prontas para envio à contraparte.',
  },
  {
    icon: AlertTriangle,
    title: 'Análise de Rescisão, Multas & Retenção',
    prompt: 'Analise detalhadamente as hipóteses de rescisão contratual, proporcionalidade das multas, retenções financeiras e possibilidade de redução com base no Art. 413 do Código Civil.',
  },
  {
    icon: Building2,
    title: 'Blindagem Trabalhista & Societária',
    prompt: 'Avalie os riscos de responsabilidade solidária/subsidiária, terceirização trabalhista (Lei 13.429/17 e 13.467/17), risco de desconsideração da personalidade jurídica e passivos ocultos.',
  },
];

const AnalysisForm: React.FC<AnalysisFormProps> = ({ onSubmit, isLoading }) => {
  // Matriz de Auditoria / Planilha
  const [idContrato, setIdContrato] = useState('CTR 02');
  const [tipoObjeto, setTipoObjeto] = useState('Empreitada Global / Obras e Serviços de Engenharia');

  // Main prompt
  const [promptSimples, setPromptSimples] = useState(
    'Realize uma auditoria jurídica minuciosa confrontando o contrato com as provas e documentos corroborativos anexados, apontando vícios e redigindo minutas blindadas para preenchimento da planilha gerencial com fundamentação legal.'
  );

  // 1. Main Document state
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    data: string;
    mimeType: string;
    size?: number;
    extractedText?: string;
    typeLabel: string;
  } | null>(null);

  const [manualText, setManualText] = useState('');
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [mainParsing, setMainParsing] = useState(false);

  // 2. Corroborating Documents state (.pdf, .doc, .docx, .ppt, .pptx, etc.)
  const [corroboratingDocs, setCorroboratingDocs] = useState<DocumentoCorroborativo[]>([]);
  const [isDraggingCorrob, setIsDraggingCorrob] = useState(false);
  const [corrobParsing, setCorrobParsing] = useState(false);

  // Common contract IDs from user's matrix
  const CONTRATOS_MATRIZ = [
    'CTR 02',
    'CTR 03',
    'CTR 04',
    'CTR 05',
    'CTR 06',
    'CTR 07',
    'CTR 08',
    'CTR 09',
    'CTR 20',
    'CTR 28',
    'CTR 35',
  ];

  // Optional parameters toggle
  const [showOptionalParams, setShowOptionalParams] = useState(false);
  const [optionalParams, setOptionalParams] = useState<OptionalParameters>({
    empresa: '',
    cnpj: '',
    papel: '',
    ramoNegocio: 'Construção Civil & Incorporação Imobiliária',
    valor: '',
    prazo: '',
    garantia: '',
    multa: '',
    preocupacoes: '',
    urgencia: 'Normal',
    perfilAnalise: 'Defensivo & Blindagem',
  });

  const handleOptionalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setOptionalParams((prev) => ({ ...prev, [name]: value }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Process Main Document
  const processMainFile = async (file: File) => {
    setMainParsing(true);
    try {
      const parsed = await parseDocumentFile(file);
      const base64 = await fileToBase64(file);

      // Auto-identificar ID Contrato pelo nome do arquivo (ex: "CTR 02 - Empreitada.pdf")
      const matchCtr = file.name.match(/CTR\s*[-_]?\s*(\d{1,3})/i);
      if (matchCtr) {
        const num = matchCtr[1].padStart(2, '0');
        setIdContrato(`CTR ${num}`);
      }

      setSelectedFile({
        name: file.name,
        data: base64,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        extractedText: parsed.text || undefined,
        typeLabel: parsed.typeLabel,
      });
      setManualText('');
    } catch (err) {
      console.error('Erro ao processar documento principal:', err);
      alert('Não foi possível processar este arquivo. Tente colar o texto diretamente.');
    } finally {
      setMainParsing(false);
    }
  };

  // Process Corroborating Documents (.pdf, .doc, .docx, .ppt, .pptx, etc.)
  const processCorroboratingFiles = async (files: FileList | File[]) => {
    setCorrobParsing(true);
    try {
      const newItems: DocumentoCorroborativo[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const parsed = await parseDocumentFile(file);
        const base64 = await fileToBase64(file);

        let defaultDesc = 'Documento Comprobatório';
        const nameLower = file.name.toLowerCase();
        if (nameLower.includes('proposta') || nameLower.includes('orcamento') || nameLower.includes('orçamento')) {
          defaultDesc = 'Proposta Comercial / Orçamento';
        } else if (nameLower.includes('ata') || nameLower.includes('reuniao') || nameLower.includes('reunião')) {
          defaultDesc = 'Ata de Reunião';
        } else if (nameLower.includes('apresentacao') || nameLower.includes('apresentação') || nameLower.endsWith('.ppt') || nameLower.endsWith('.pptx')) {
          defaultDesc = 'Apresentação de Diretoria / Alinhamento';
        } else if (nameLower.includes('email') || nameLower.includes('e-mail') || nameLower.includes('notificacao')) {
          defaultDesc = 'E-mail / Notificação Prévia';
        } else if (nameLower.includes('laudo') || nameLower.includes('parecer')) {
          defaultDesc = 'Laudo Técnico / Parecer';
        }

        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          data: base64,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          extractedText: parsed.text || undefined,
          tipoLabel: parsed.typeLabel,
          descricao: defaultDesc,
        });
      }

      setCorroboratingDocs((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error('Erro ao ler documentos corroborativos:', err);
      alert('Houve um erro ao processar um dos documentos corroborativos.');
    } finally {
      setCorrobParsing(false);
    }
  };

  const removeCorroboratingDoc = (id: string) => {
    setCorroboratingDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const updateCorroboratingDesc = (id: string, descricao: string) => {
    setCorroboratingDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, descricao } : d))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && !manualText.trim() && corroboratingDocs.length === 0) {
      alert('Por favor, anexe o documento a ser analisado ou documentos corroborativos com a decisão.');
      return;
    }

    if (!promptSimples.trim()) {
      alert('Por favor, descreva o que você deseja que o advogado empresarial analise.');
      return;
    }

    // Determine final text to send for main doc
    let docText: string | undefined = undefined;
    if (selectedFile?.extractedText) {
      docText = selectedFile.extractedText;
    } else if (manualText.trim()) {
      docText = manualText.trim();
    }

    // If text was extracted from RTF/DOC/TXT, we send the extracted clean text
    // If it's a PDF, we include the base64 data for Gemini inlineData
    const arquivoPayload = selectedFile
      ? {
          name: selectedFile.name,
          // Only send heavy base64 data if it's PDF or if text couldn't be extracted
          data: selectedFile.mimeType.includes('pdf') || !selectedFile.extractedText
            ? selectedFile.data
            : '',
          mimeType: selectedFile.mimeType,
          size: selectedFile.size,
        }
      : undefined;

    // Filter optional parameters
    const filledOptionals: OptionalParameters = {};
    (Object.keys(optionalParams) as (keyof OptionalParameters)[]).forEach((k) => {
      const val = optionalParams[k];
      if (val && typeof val === 'string' && val.trim().length > 0) {
        filledOptionals[k] = val as any;
      }
    });

    onSubmit({
      promptSimples: promptSimples.trim(),
      idContrato: idContrato.trim() || 'CTR',
      tipoObjeto: tipoObjeto.trim() || 'Instrumento Contratual',
      documentoTexto: docText,
      arquivo: arquivoPayload,
      documentosCorroborativos: corroboratingDocs.length > 0 ? corroboratingDocs : undefined,
      parametrosOpcionais: Object.keys(filledOptionals).length > 0 ? filledOptionals : undefined,
    });
  };

  const inputClass =
    'w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400';
  const labelClass = 'block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1';

  const getDocTypeIcon = (tipoLabel: string, name: string) => {
    const lower = (tipoLabel + ' ' + name).toLowerCase();
    if (lower.includes('powerpoint') || lower.includes('ppt')) {
      return <Presentation className="w-5 h-5 text-orange-500" />;
    }
    if (lower.includes('word') || lower.includes('doc')) {
      return <FileSpreadsheet className="w-5 h-5 text-blue-500" />;
    }
    if (lower.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (lower.includes('rtf')) {
      return <FileCode className="w-5 h-5 text-amber-500" />;
    }
    return <Paperclip className="w-5 h-5 text-slate-500" />;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 0. IDENTIFICAÇÃO NA PLANILHA MATRIZ (COLUNAS A A F) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/80 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Identificação na Planilha de Auditoria (Colunas A a F)
              </h3>
              <p className="text-slate-300 text-xs mt-0.5">
                O parecer preencherá automaticamente as colunas da sua planilha gerencial de contratos.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold self-start sm:self-center">
            Matriz CTR Ativa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* ID Contrato */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
              Coluna A: ID do Contrato
            </label>
            <div className="relative">
              <input
                type="text"
                value={idContrato}
                onChange={(e) => setIdContrato(e.target.value.toUpperCase())}
                placeholder="Ex: CTR 02, CTR 03, CTR 04..."
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-600 rounded-xl text-white font-bold text-sm tracking-wide focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                {idContrato || 'CTR'}
              </span>
            </div>
            {/* Quick chips dos contratos */}
            <div className="pt-1">
              <span className="text-[10px] text-slate-400 font-medium block mb-1.5">
                Contratos da Planilha (clique para preencher):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {CONTRATOS_MATRIZ.map((ctr) => (
                  <button
                    key={ctr}
                    type="button"
                    onClick={() => setIdContrato(ctr)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-all ${
                      idContrato.trim().toUpperCase() === ctr
                        ? 'bg-amber-500 text-slate-950 shadow-sm scale-105'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {ctr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tipo / Objeto */}
          <div className="md:col-span-7 space-y-2">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
              Coluna B: Tipo / Objeto do Contrato
            </label>
            <input
              type="text"
              value={tipoObjeto}
              onChange={(e) => setTipoObjeto(e.target.value)}
              placeholder="Ex: Empreitada Global / Obras Civis e Serviços de Engenharia"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-600 rounded-xl text-white text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none placeholder:text-slate-500"
            />
            {/* Visual preview of the 6 columns */}
            <div className="mt-3 p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 text-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                Estrutura das Colunas Geradas na Auditoria:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="p-1.5 bg-slate-900 rounded border border-slate-700 text-slate-300">
                  <span className="text-amber-400 font-bold">Col A:</span> ID Contrato
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-700 text-slate-300">
                  <span className="text-amber-400 font-bold">Col B:</span> Tipo / Objeto
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-700 text-slate-300">
                  <span className="text-amber-400 font-bold">Col C:</span> Cláusula Auditada
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-700 text-slate-300">
                  <span className="text-amber-400 font-bold">Col D:</span> Diagnóstico / Vício
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-700 text-slate-300">
                  <span className="text-amber-400 font-bold">Col E:</span> Redação Blindada
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-700 text-slate-300">
                  <span className="text-amber-400 font-bold">Col F:</span> Fundamentação
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 1. SELEÇÃO / UPLOAD DO DOCUMENTO PRINCIPAL A SER ANALISADO */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              1. Documento Principal para Análise Jurídica
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              O contrato, minuta de distrato, notificação ou cláusulas que serão auditadas. Suporte nativo a <strong>.RTF</strong>, <strong>.PDF</strong>, <strong>.DOC/.DOCX</strong> e <strong>.TXT</strong>.
            </p>
          </div>
          {selectedFile && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Documento Carregado
            </span>
          )}
        </div>

        {!selectedFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingMain(true);
            }}
            onDragLeave={() => setIsDraggingMain(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingMain(false);
              const file = e.dataTransfer.files[0];
              if (file) processMainFile(file);
            }}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDraggingMain
                ? 'border-slate-900 bg-slate-100/70 scale-[1.01]'
                : 'border-slate-300 hover:border-slate-500 bg-slate-50/70'
            }`}
          >
            <input
              type="file"
              accept=".rtf,.pdf,.txt,.doc,.docx,application/rtf,text/rtf,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => e.target.files?.[0] && processMainFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center pointer-events-none">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-3 shadow-md">
                <UploadCloud className="w-7 h-7 text-amber-400" />
              </div>
              <h4 className="text-slate-900 font-bold text-base">
                {mainParsing ? 'Decodificando documento...' : 'Arraste o documento principal aqui ou clique para selecionar'}
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Suporta <span className="font-semibold text-slate-800">.RTF (Rich Text)</span>,{' '}
                <span className="font-semibold text-slate-800">.PDF</span>,{' '}
                <span className="font-semibold text-slate-800">.DOC / .DOCX</span> e{' '}
                <span className="font-semibold text-slate-800">.TXT</span>
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 uppercase tracking-wider shadow-sm">
                  .RTF
                </span>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 uppercase tracking-wider shadow-sm">
                  .PDF
                </span>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 uppercase tracking-wider shadow-sm">
                  .DOC / .DOCX
                </span>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 uppercase tracking-wider shadow-sm">
                  .TXT
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {getDocTypeIcon(selectedFile.typeLabel, selectedFile.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 truncate max-w-xs md:max-w-md">
                    {selectedFile.name}
                  </p>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded">
                    {selectedFile.typeLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Tamanho pronto para envio'}
                  {selectedFile.extractedText && (
                    <span className="ml-2 text-emerald-700 font-semibold">
                      • {selectedFile.extractedText.length.toLocaleString('pt-BR')} caracteres extraídos com sucesso
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5 transition-colors self-end md:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover Arquivo
            </button>
          </div>
        )}

        {/* Ou colar texto manualmente */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              Ou cole as cláusulas / contrato diretamente:
            </label>
            {manualText && (
              <span className="text-[11px] text-slate-400">
                {manualText.length.toLocaleString('pt-BR')} caracteres digitados
              </span>
            )}
          </div>
          <textarea
            value={manualText}
            onChange={(e) => {
              setManualText(e.target.value);
              if (e.target.value && selectedFile) {
                setSelectedFile(null);
              }
            }}
            rows={selectedFile ? 2 : 4}
            placeholder={
              selectedFile
                ? 'Documento principal carregado acima. Para colar texto manual alternativo, digite aqui...'
                : 'Cole aqui o contrato, instrumento de distrato, notificação extrajudicial, memorial descritivo ou cláusula que deseja analisar...'
            }
            className={`${inputClass} font-mono text-xs leading-relaxed resize-y`}
          />
        </div>
      </div>

      {/* 2. NOVO CAMPO: DOCUMENTOS QUE CORROBOREM COM A DECISÃO (.PDF, .DOC, .PPT) */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-indigo-600" />
              2. Documentos que Corroborem com a Decisão
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Anexe documentos probatórios e complementares para sustentar a decisão: propostas comerciais, atas de reunião, apresentações de diretoria, laudos ou e-mails.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200">
              Aceita .PDF • .DOC • .PPT
            </span>
            {corroboratingDocs.length > 0 && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {corroboratingDocs.length} anexo(s)
              </span>
            )}
          </div>
        </div>

        {/* Dropzone para documentos corroborativos */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingCorrob(true);
          }}
          onDragLeave={() => setIsDraggingCorrob(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingCorrob(false);
            if (e.dataTransfer.files?.length) {
              processCorroboratingFiles(e.dataTransfer.files);
            }
          }}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
            isDraggingCorrob
              ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.rtf,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/rtf"
            onChange={(e) => e.target.files && processCorroboratingFiles(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center pointer-events-none">
            <div className="w-12 h-12 bg-indigo-900 text-white rounded-xl flex items-center justify-center mb-2.5 shadow-sm">
              <Plus className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-slate-900 font-bold text-sm">
              {corrobParsing
                ? 'Processando documentos corroborativos...'
                : 'Clique ou arraste aqui arquivos que comprovem e corroborem com a decisão'}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Compatível com arquivos <strong className="text-slate-800">.PDF</strong>,{' '}
              <strong className="text-slate-800">.DOC / .DOCX (Word)</strong>,{' '}
              <strong className="text-slate-800">.PPT / .PPTX (PowerPoint)</strong>, .RTF e .TXT
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-bold">
                <FileText className="w-3.5 h-3.5" /> PDF
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-bold">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Word (.DOC/.DOCX)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-[11px] font-bold">
                <Presentation className="w-3.5 h-3.5" /> PowerPoint (.PPT/.PPTX)
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Documentos Corroborativos Carregados */}
        {corroboratingDocs.length > 0 && (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Documentos Corroborativos Anexados ({corroboratingDocs.length}):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {corroboratingDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between gap-2.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                        {getDocTypeIcon(doc.tipoLabel, doc.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate" title={doc.name}>
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-700">{doc.tipoLabel}</span>
                          <span>•</span>
                          <span>{doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Anexado'}</span>
                          {doc.extractedText && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">
                                {doc.extractedText.length.toLocaleString('pt-BR')} chars
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCorroboratingDoc(doc.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                      title="Remover documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Campo para identificar o que este documento corrobora */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                      Função probatória:
                    </label>
                    <input
                      type="text"
                      value={doc.descricao || ''}
                      onChange={(e) => updateCorroboratingDesc(doc.id, e.target.value)}
                      placeholder="Ex: Proposta original, Ata de reunião, Apresentação técnica"
                      className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. INSTRUÇÃO / PROMPT SIMPLES PARA O ADVOGADO */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              3. Instrução para o Advogado Empresarial
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Diga em linguagem simples o que você precisa que o advogado avalie, redija, confronte ou audite.
            </p>
          </div>
        </div>

        {/* Textarea do Prompt Simples */}
        <div>
          <textarea
            value={promptSimples}
            onChange={(e) => setPromptSimples(e.target.value)}
            rows={3}
            placeholder="Exemplo: Analise este contrato em confronto com os documentos corroborativos anexados, aponte cláusulas abusivas e verifique se as promessas da apresentação .ppt e proposta .doc foram cumpridas..."
            className="w-full px-4 py-3 text-sm font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 shadow-inner"
            required
          />
        </div>

        {/* Sugestões Rápidas de Prompt (1 Clique) */}
        <div className="mt-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Sugestões Rápidas de Consultoria (Clique para aplicar):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {QUICK_PROMPTS.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = promptSimples === item.prompt;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptSimples(item.prompt)}
                  className={`text-left p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="leading-snug">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. PARÂMETROS OPCIONAIS DE CONTEXTO (TOTALMENTE OPCIONAIS) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOptionalParams(!showOptionalParams)}
          className="w-full p-5 md:px-8 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Parâmetros de Contexto Empresarial
                </h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-slate-200">
                  Opcional
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                Preencha apenas se desejar especificar dados da empresa, posição defendida ou foco negocial.
              </p>
            </div>
          </div>
          <div className="text-slate-400 flex items-center gap-1 text-xs font-semibold">
            <span>{showOptionalParams ? 'Ocultar' : 'Personalizar'}</span>
            {showOptionalParams ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showOptionalParams && (
          <div className="p-6 md:p-8 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Empresa / Cliente Representado</label>
                <input
                  name="empresa"
                  value={optionalParams.empresa}
                  onChange={handleOptionalChange}
                  placeholder="Ex: Construtora Alpha S/A"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>CNPJ (Opcional)</label>
                <input
                  name="cnpj"
                  value={optionalParams.cnpj}
                  onChange={handleOptionalChange}
                  placeholder="00.000.000/0000-00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Posição / Interesse Defendido</label>
                <select
                  name="papel"
                  value={optionalParams.papel}
                  onChange={handleOptionalChange}
                  className={inputClass}
                >
                  <option value="">Automático (detectado pelo texto)</option>
                  <option value="Contratante / Dono da Obra">Contratante / Dono da Obra</option>
                  <option value="Contratada / Prestador de Serviço">Contratada / Prestador de Serviço</option>
                  <option value="Incorporadora Imobiliária">Incorporadora Imobiliária</option>
                  <option value="Comprador / Adquirente">Comprador / Adquirente</option>
                  <option value="Vendedor / Alienante">Vendedor / Alienante</option>
                  <option value="Sócio / Acionista">Sócio / Acionista</option>
                  <option value="Locador / Locatário">Locador / Locatário</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Ramo de Atuação</label>
                <input
                  name="ramoNegocio"
                  value={optionalParams.ramoNegocio}
                  onChange={handleOptionalChange}
                  placeholder="Ex: Engenharia, Tecnologia, Varejo"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Valor do Negócio / Contrato</label>
                <input
                  name="valor"
                  value={optionalParams.valor}
                  onChange={handleOptionalChange}
                  placeholder="Ex: R$ 1.500.000,00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Perfil da Análise Jurídica</label>
                <select
                  name="perfilAnalise"
                  value={optionalParams.perfilAnalise}
                  onChange={handleOptionalChange}
                  className={inputClass}
                >
                  <option value="Defensivo & Blindagem">Defensivo & Blindagem de Riscos</option>
                  <option value="Equilibrado & Negocial">Equilibrado & Facilitador de Negócios</option>
                  <option value="Agressivo & Combate de Riscos">Agressivo & Questionamento Rigoroso</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Preocupações Específicas / Ponto de Atenção</label>
              <input
                name="preocupacoes"
                value={optionalParams.preocupacoes}
                onChange={handleOptionalChange}
                placeholder="Ex: 'Quero ter certeza de que não há risco de retenção abusiva' ou 'Garantir prazo de tolerância de 180 dias'"
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      {/* BOTÃO PRINCIPAL DE SUBMISSÃO */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-3 text-base shadow-lg ${
          isLoading
            ? 'bg-slate-600 cursor-wait'
            : 'bg-slate-900 hover:bg-black active:scale-[0.99] shadow-slate-900/10'
        }`}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-amber-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Advogado Empresarial Analisando Documentos e Legislação...</span>
          </>
        ) : (
          <>
            <Scale className="w-5 h-5 text-amber-400" />
            <span>Consultar Advogado Empresarial Sênior</span>
          </>
        )}
      </button>
    </form>
  );
};

export default AnalysisForm;
