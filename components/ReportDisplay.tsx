import React, { useState, useEffect } from 'react';
import { StructuredAnalysisResult, ChatMessage, PlanilhaLinha } from '../types';
import { sendChatQuestion, refineLegalReport } from '../services/geminiService';
import { downloadReportAsPDF } from '../utils/pdfGenerator';
import {
  getLinhasConsolidadas,
  salvarLinhasNaMatriz,
  copiarParaClipboardExcel,
  exportarParaExcelXLSX,
  exportarParaCSV,
  limparHistoricoPlanilha,
  removerContratoDoHistorico,
} from '../utils/planilhaStorage';
import {
  Scale,
  ShieldAlert,
  FileText,
  Copy,
  Check,
  Download,
  Printer,
  MessageSquare,
  Send,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Award,
  Briefcase,
  Paperclip,
  CheckCircle2,
  Layers,
  AlertTriangle,
  UserCheck,
  Building2,
  RefreshCw,
  Wand2,
  Sliders,
  CheckCheck,
  FileSpreadsheet,
  Table,
  FileDown,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface ReportDisplayProps {
  report: StructuredAnalysisResult;
  onNewAnalysis: () => void;
  onUpdateReport?: (updated: StructuredAnalysisResult) => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, onNewAnalysis, onUpdateReport }) => {
  const [currentReport, setCurrentReport] = useState<StructuredAnalysisResult>(report);
  const [activeTab, setActiveTab] = useState<'chat' | 'planilha' | 'parecer' | 'clausulas' | 'textoCompleto'>('chat');
  const [copiedClauseIdx, setCopiedClauseIdx] = useState<number | null>(null);
  const [copiedRowIdx, setCopiedRowIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Planilha Matriz & Persistência Local
  const [filtroPlanilha, setFiltroPlanilha] = useState<'atual' | 'consolidada'>('atual');
  const [matrizConsolidada, setMatrizConsolidada] = useState<PlanilhaLinha[]>([]);
  const [planilhaToast, setPlanilhaToast] = useState<string | null>(null);

  // Chat follow-up and refinement state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refineSuccessNotice, setRefineSuccessNotice] = useState<string | null>(null);

  // Derivar linhas da planilha do contrato atual
  const obterLinhasContratoAtual = (rep: StructuredAnalysisResult): PlanilhaLinha[] => {
    if (rep.linhasPlanilha && rep.linhasPlanilha.length > 0) {
      return rep.linhasPlanilha;
    }
    return (rep.clausulas || []).map((c) => ({
      idContrato: rep.idContrato || 'CTR 02',
      tipoObjeto: rep.tipoObjeto || 'Instrumento Contratual',
      clausulaAuditada: `${c.numero} - ${c.titulo}`.trim(),
      diagnosticoVicio: c.diagnostico || '',
      redacaoBlindada: c.redacaoSugerida || '',
      fundamentacaoLegal: c.fundamentacaoLegal || 'Código Civil Brasileiro',
      grauRisco: c.grauRisco,
    }));
  };

  const linhasContratoAtual = obterLinhasContratoAtual(currentReport);
  const linhasExibicao = filtroPlanilha === 'consolidada' ? matrizConsolidada : linhasContratoAtual;

  // Sync state if initial prop changes e salvar na matriz consolidada
  useEffect(() => {
    setCurrentReport(report);
    const linhas = obterLinhasContratoAtual(report);
    const consolidadaAtualizada = salvarLinhasNaMatriz(linhas);
    setMatrizConsolidada(consolidadaAtualizada);
  }, [report]);

  // Carregar histórico local inicial
  useEffect(() => {
    const historico = getLinhasConsolidadas();
    if (historico && historico.length > 0) {
      setMatrizConsolidada(historico);
    }
  }, []);

  // Proactive Initial Briefing from the Corporate Lawyer in the Chat
  useEffect(() => {
    if (chatMessages.length === 0) {
      const totalClausulas = currentReport.clausulas?.length || 0;
      const initialGreeting: ChatMessage = {
        id: 'init-briefing',
        sender: 'lawyer',
        text: `Olá! Concluí a auditoria técnica de "${currentReport.titulo || 'seu documento'}".

• Score de Exposição: ${currentReport.scoreRisco}/100 (${currentReport.classificacaoRisco})
• Cláusulas Auditadas: ${totalClausulas} cláusula(s) com apontamentos de risco ou assimetria.

Esta é a nossa Consultoria Interativa. Aqui podemos:
1. Discutir qualquer dúvida sobre cláusulas, penalidades ou os documentos corroborativos analisados.
2. Calibrar prazos, multas e garantias para refletir as decisões da sua diretoria ou da mesa de negociação.
3. Sempre que alinharmos termos, você pode clicar em "✨ Atualizar Parecer com a Conversa" para recalcular o risco e oficializar as minutas.
4. E quando o resultado estiver 100% conforme o seu entendimento, basta clicar em "Exportar em PDF" para emitir o relatório homologado.

Por qual cláusula ou ponto negocial gostaria de começar?`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages([initialGreeting]);
    }
  }, [currentReport.titulo]);

  const getScoreBadge = (score: number) => {
    if (score <= 30) {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        ring: 'border-emerald-500 text-emerald-700',
        label: 'Risco Baixo',
        desc: 'Instrumento equilibrado com conformidade jurídica adequada.',
      };
    }
    if (score <= 60) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-300',
        ring: 'border-amber-500 text-amber-700',
        label: 'Risco Médio',
        desc: 'Exige ajustes pontuais para mitigar assimetrias e penalidades.',
      };
    }
    if (score <= 80) {
      return {
        bg: 'bg-orange-50 text-orange-800 border-orange-300',
        ring: 'border-orange-500 text-orange-700',
        label: 'Risco Alto',
        desc: 'Contém cláusulas desfavoráveis e exposição patrimonial sensível.',
      };
    }
    return {
      bg: 'bg-red-50 text-red-800 border-red-300',
      ring: 'border-red-600 text-red-700',
      label: 'Risco Crítico',
      desc: 'Cláusulas potencialmente leoninas, ilegais ou de alto passivo.',
    };
  };

  const scoreInfo = getScoreBadge(currentReport.scoreRisco);

  const handleCopyClause = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedClauseIdx(idx);
    setTimeout(() => setCopiedClauseIdx(null), 2500);
  };

  const handleCopyFullReport = () => {
    navigator.clipboard.writeText(currentReport.relatorioMarkdownCompleto || currentReport.resumoExecutivo);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      await downloadReportAsPDF(currentReport, chatMessages);
    } catch (err) {
      console.error('Erro na exportação para PDF:', err);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleSendChat = async (e?: React.FormEvent, directMessage?: string) => {
    if (e) e.preventDefault();
    const query = (directMessage || chatInput).trim();
    if (!query || chatLoading || isRefining) return;

    setActiveTab('chat');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const answer = await sendChatQuestion(
        query,
        currentReport.resumoExecutivo +
          '\n' +
          (currentReport.cruzamentoCorroborativo ? `Cruzamento com documentos probatórios: ${currentReport.cruzamentoCorroborativo}\n` : '') +
          (currentReport.clausulas?.map((c) => `${c.numero}: ${c.diagnostico} | Redação sugerida: ${c.redacaoSugerida}`).join('\n') || ''),
        currentReport.relatorioMarkdownCompleto,
        [...chatMessages, userMsg]
      );

      const lawyerMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'lawyer',
        text: answer,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, lawyerMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'lawyer',
        text: 'Não foi possível consultar os precedentes no momento. Verifique sua conexão e tente novamente.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Function to incorporate conversational decisions into the official report
  const handleRefineReport = async (instruction?: string) => {
    if (isRefining || chatLoading) return;
    setIsRefining(true);
    setRefineSuccessNotice(null);

    try {
      const refined = await refineLegalReport(currentReport, chatMessages, instruction);
      setCurrentReport(refined);
      onUpdateReport?.(refined);

      const successText = `Parecer Oficial aprimorado para a Versão v${refined.versaoParecer || 2}.0! O Score de Risco foi calibrado para ${refined.scoreRisco}/100 (${refined.classificacaoRisco}) e as minutas foram alinhadas às suas deliberações.`;
      setRefineSuccessNotice(successText);

      // Add lawyer confirmation into the chat history
      const lawyerNotice: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'lawyer',
        text: `⚖️ **Parecer Oficial Atualizado (Versão v${refined.versaoParecer || 2}.0)**:
Incorporei as decisões e concessões alinhadas na nossa conversa:
${refined.ajustesRealizadosNaConversa?.map((a) => `• ${a}`).join('\n') || '• Cláusulas e diretrizes estratégicas revisadas.'}

O Score de Risco foi recalculado para **${refined.scoreRisco}/100 (${refined.classificacaoRisco})**. As abas de Cláusulas e Diagnóstico foram atualizadas. Se estiver satisfeito, você já pode clicar em "Exportar em PDF" para emitir o relatório final!`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, lawyerNotice]);

      setTimeout(() => {
        setRefineSuccessNotice(null);
      }, 7000);
    } catch (err: any) {
      console.error('Erro ao aprimorar parecer:', err);
      alert('Não foi possível aprimorar o parecer automaticamente: ' + (err?.message || 'Erro desconhecido.'));
    } finally {
      setIsRefining(false);
    }
  };

  const mostrarToast = (msg: string) => {
    setPlanilhaToast(msg);
    setTimeout(() => {
      setPlanilhaToast(null);
    }, 6000);
  };

  const handleExportarExcel = () => {
    setIsExportingExcel(true);
    try {
      const nomeBase =
        filtroPlanilha === 'consolidada'
          ? 'Matriz_Consolidada_Contratos_Auditoria'
          : `Planilha_Auditoria_${currentReport.idContrato || 'CTR'}`;
      exportarParaExcelXLSX(linhasExibicao, nomeBase);
      mostrarToast(`Planilha Excel (.xlsx) com ${linhasExibicao.length} linhas baixada com sucesso!`);
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
      alert('Houve um problema ao gerar o arquivo Excel. Você também pode usar a opção "Baixar CSV".');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportarCSV = () => {
    const nomeBase =
      filtroPlanilha === 'consolidada'
        ? 'Matriz_Consolidada_Contratos_Auditoria'
        : `Planilha_Auditoria_${currentReport.idContrato || 'CTR'}`;
    exportarParaCSV(linhasExibicao, nomeBase);
    mostrarToast(`Arquivo CSV (.csv) com ${linhasExibicao.length} linhas baixado com sucesso!`);
  };

  const handleCopiarParaExcel = () => {
    const sucesso = copiarParaClipboardExcel(linhasExibicao);
    if (sucesso) {
      mostrarToast(`Copiado! Pressione Ctrl+V no Excel para preencher as colunas A a F (${linhasExibicao.length} linhas).`);
    } else {
      alert('Não foi possível copiar para a área de transferência.');
    }
  };

  const handleCopiarMinutaLinha = (linha: PlanilhaLinha, index: number) => {
    if (linha.redacaoBlindada) {
      navigator.clipboard.writeText(linha.redacaoBlindada);
      setCopiedRowIdx(index);
      setTimeout(() => setCopiedRowIdx(null), 2500);
      mostrarToast(`Minuta blindada da linha ${index + 1} copiada para a área de transferência!`);
    }
  };

  const handleLimparMatriz = () => {
    if (window.confirm('Deseja limpar todo o histórico acumulado de contratos da matriz consolidada?')) {
      limparHistoricoPlanilha();
      setMatrizConsolidada(linhasContratoAtual);
      mostrarToast('Histórico consolidado da planilha limpo com sucesso.');
    }
  };

  const handleRemoverCTR = (idParaRemover: string) => {
    if (window.confirm(`Deseja remover as linhas do contrato "${idParaRemover}" da matriz consolidada?`)) {
      const atualizada = removerContratoDoHistorico(idParaRemover);
      setMatrizConsolidada(atualizada);
      mostrarToast(`Contrato ${idParaRemover} removido da matriz.`);
    }
  };

  // Contratos únicos presentes na matriz consolidada
  const contratosUnicos = Array.from(new Set(matrizConsolidada.map((l) => l.idContrato)));

  return (
    <div className="space-y-6">
      {/* Toast Informativo da Planilha */}
      {planilhaToast && (
        <div className="fixed top-6 right-6 z-[10000000] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center justify-between gap-3.5 no-print animate-in fade-in slide-in-from-top-3 max-w-md">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{planilhaToast}</span>
          </div>
          <button
            onClick={() => setPlanilhaToast(null)}
            className="text-slate-400 hover:text-white text-xs font-bold shrink-0 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Feedback Flutuante de Geração de PDF (não interfere com a captura) */}
      {isExportingPDF && (
        <div className="fixed bottom-6 right-6 z-[10000000] bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3.5 no-print animate-in fade-in slide-in-from-bottom-3 max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Compilando Parecer em PDF...</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Formatando cláusulas, minutas blindadas e histórico...</div>
          </div>
        </div>
      )}

      {/* Modal de Sincronização / Refinamento em Andamento */}
      {isRefining && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[1000000] p-4 no-print">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center space-y-4 border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
              <RefreshCw className="w-7 h-7 animate-spin text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Aprimorando Parecer Jurídico Oficial</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                O Advogado Empresarial Sênior está incorporando os pontos discutidos na conversa, calibrando o índice de risco, atualizando as minutas de cláusulas e consolidando a nova versão...
              </p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-600 h-1.5 rounded-full animate-pulse w-4/5 mx-auto"></div>
            </div>
            <p className="text-[11px] text-slate-400">Aplicando diretrizes negociais em instantes...</p>
          </div>
        </div>
      )}

      {/* BARRA DE PROGRESSO DO FLUXO DE TRABALHO (WORKFLOW STEPPER) */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-2xs no-print">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              ✓
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Passo 1</span>
              <span className="text-xs font-bold text-slate-900">Auditoria & Planilha Gerada</span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300 hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              📊
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Matriz CTR</span>
              <span className="text-xs font-bold text-slate-900">Colunas A a F Preenchidas</span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300 hidden md:block" />

          <div className="flex items-center gap-3 bg-amber-50/80 px-3.5 py-2 rounded-xl border border-amber-200">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
              💬
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Passo 2</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-950 text-[9px] font-extrabold uppercase">Ativo</span>
              </div>
              <span className="text-xs font-bold text-slate-900">Consultoria & Refinamento</span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300 hidden md:block" />

          <div className="flex items-center gap-3 opacity-90">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Passo 3</span>
              <span className="text-xs font-bold text-slate-700">Exportação Excel & PDF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={onNewAnalysis}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Novo Contrato
          </button>

          {currentReport.versaoParecer && currentReport.versaoParecer > 1 && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-lg border border-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              Parecer Versão v{currentReport.versaoParecer}.0 (Aprimorado)
            </span>
          )}

          <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-extrabold rounded-lg">
            {currentReport.idContrato || 'CTR'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Copiar para Excel */}
          <button
            onClick={handleCopiarParaExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-950 text-xs font-bold rounded-lg transition-colors shadow-2xs"
            title="Copiar todas as linhas das colunas A a F para colar diretamente no Excel (Ctrl+V)"
          >
            <Copy className="w-4 h-4 text-emerald-700" />
            Copiar p/ Excel
          </button>

          {/* Botão Baixar Excel */}
          <button
            onClick={handleExportarExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            title="Baixar planilha formatada em Excel (.xlsx) com colunas A a F preenchidas"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            {isExportingExcel ? 'Gerando...' : 'Exportar Excel (.xlsx)'}
          </button>

          {/* Botão Sincronizar Conversa com Parecer */}
          <button
            onClick={() => handleRefineReport()}
            disabled={isRefining || chatMessages.length <= 1}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-40 disabled:hover:bg-amber-500"
            title="Sincroniza o relatório oficial e a planilha com as conclusões e ajustes acordados na conversa"
          >
            <Wand2 className="w-4 h-4" />
            Aprimorar Parecer
          </button>

          {/* Botão Baixar PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPDF || isRefining}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            title="Baixar arquivo .PDF completo com todas as cláusulas e histórico da consultoria"
          >
            <Download className="w-4 h-4 text-amber-400" />
            {isExportingPDF ? 'Gerando PDF...' : 'Exportar em PDF'}
          </button>
        </div>
      </div>

      {/* Banner de Sucesso quando o parecer é aprimorado */}
      {refineSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl flex items-center justify-between gap-3 shadow-sm no-print animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{refineSuccessNotice}</span>
          </div>
          <button
            onClick={() => setRefineSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Executive Summary Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-amber-50 text-amber-900 text-[11px] font-extrabold uppercase tracking-wider rounded-md border border-amber-200">
                Parecer Jurídico Empresarial
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md">
                Versão v{currentReport.versaoParecer || 1}.0
              </span>
              <span className="text-xs text-slate-400">
                Data: {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
              {currentReport.titulo || 'Auditoria & Consultoria Jurídica'}
            </h2>
            <p className="text-slate-500 text-xs flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <strong>Partes & Objeto:</strong> {currentReport.partesIdentificadas || 'Partes e instrumento analisados'}
            </p>
          </div>

          {/* Risk Score Dial */}
          <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200 self-start lg:self-auto shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Índice de Exposição
              </span>
              <span className="text-base font-extrabold text-slate-900 block">
                {scoreInfo.label}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:block max-w-[140px] leading-tight mt-0.5">
                {scoreInfo.desc}
              </span>
            </div>
            <div
              className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center bg-white shadow-md ${scoreInfo.ring}`}
            >
              <span className="text-2xl font-black leading-none">{currentReport.scoreRisco}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* Ajustes incorporados da conversa (se houver) */}
        {currentReport.ajustesRealizadosNaConversa && currentReport.ajustesRealizadosNaConversa.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Deliberações Negociais Incorporadas na Consultoria Interativa (v{currentReport.versaoParecer || 1}.0):
            </h3>
            <div className="space-y-1.5 text-xs text-amber-950">
              {currentReport.ajustesRealizadosNaConversa.map((ajuste, i) => (
                <div key={i} className="flex items-start gap-2 bg-white/70 p-2 rounded border border-amber-100 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{ajuste}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo Executivo */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            Síntese Executiva & Diagnóstico Estratégico
          </h3>
          <p className="text-sm md:text-base text-slate-800 leading-relaxed font-normal bg-slate-50 p-5 rounded-xl border border-slate-200/80">
            {currentReport.resumoExecutivo}
          </p>
        </div>

        {/* Bloco de Confronto / Cruzamento com Documentos Corroborativos */}
        {(currentReport.cruzamentoCorroborativo || (currentReport.documentosCorroborativosAnalisados && currentReport.documentosCorroborativosAnalisados.length > 0)) && (
          <div className="mt-6 p-5 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-700" />
                Confronto Probatório & Documentos Corroborativos Analisados
              </h3>
              {currentReport.documentosCorroborativosAnalisados && currentReport.documentosCorroborativosAnalisados.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-200/60 text-indigo-900 rounded-md">
                  {currentReport.documentosCorroborativosAnalisados.length} documento(s) confrontado(s)
                </span>
              )}
            </div>

            {currentReport.documentosCorroborativosAnalisados && currentReport.documentosCorroborativosAnalisados.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {currentReport.documentosCorroborativosAnalisados.map((docNome, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-950 text-xs font-medium rounded-lg shadow-2xs"
                  >
                    <Paperclip className="w-3 h-3 text-indigo-500" />
                    {docNome}
                  </span>
                ))}
              </div>
            )}

            {currentReport.cruzamentoCorroborativo && (
              <p className="text-xs md:text-sm text-indigo-950 leading-relaxed font-medium bg-white/80 p-3.5 rounded-lg border border-indigo-100">
                {currentReport.cruzamentoCorroborativo}
              </p>
            )}
          </div>
        )}

        {/* Principais Riscos Identificados */}
        {currentReport.principaisRiscos && currentReport.principaisRiscos.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Armadilhas & Riscos Críticos Identificados:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {currentReport.principaisRiscos.map((risco, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-red-50/60 border border-red-100 text-xs text-slate-800"
                >
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="font-medium leading-relaxed">{risco}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CAMPO DE INTERAÇÃO COM A IA NA NARRATIVA CRIADA (MIX INTELIGENTE) */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 p-4 md:p-5 rounded-xl border border-amber-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Interagir com o Agente de IA sobre a Narrativa & Inserir Novas Informações
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Insira novas decisões, fatos ou instrua a IA para ajustar cláusulas, calibrar o parecer e atualizar a planilha gerencial.
                  </p>
                </div>
              </div>

              {chatMessages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline self-start sm:self-auto"
                >
                  Ver histórico da conversa ({chatMessages.length} msgs) →
                </button>
              )}
            </div>

            <form onSubmit={handleSendChat} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ex: 'Incorpore que o prazo acordado é de 20 dias', 'Ajuste a multa da Cláusula 4ª' ou 'Como rebater o vício de rescisão?'..."
                className="flex-1 px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 bg-white placeholder:text-slate-400 shadow-2xs"
                disabled={chatLoading || isRefining}
              />
              <button
                type="submit"
                disabled={chatLoading || isRefining || !chatInput.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Enviar à IA</span>
              </button>
            </form>

            {/* Sugestões Rápidas de Ajuste da Narrativa */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-amber-100/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Sugestões:</span>
              {[
                'Ajustar cláusula penal para 10% (Art. 413 CC)',
                'Considerar termo de aditamento com novo cronograma',
                'Proteger retenção financeira contra glosas imotivadas',
                'Está tudo conforme meu entendimento. Atualizar parecer!'
              ].map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (sug.includes('Atualizar parecer')) {
                      handleRefineReport('O cliente informou que está de acordo com as deliberações. Formalize o parecer oficial.');
                    } else {
                      setChatInput(sug);
                      setActiveTab('chat');
                    }
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-slate-700 transition-colors font-medium shadow-2xs"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 gap-2 no-print overflow-x-auto">
        <button
          onClick={() => setActiveTab('chat')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'border-amber-600 text-amber-950 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-600" />
          <span>Consultoria & Refinamento com Agente</span>
          <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-extrabold">
            Ativa
          </span>
        </button>

        <button
          onClick={() => setActiveTab('planilha')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'planilha'
              ? 'border-emerald-600 text-emerald-950 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Planilha de Auditoria (Colunas A a F)</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-[10px] font-extrabold">
            {linhasExibicao.length} {linhasExibicao.length === 1 ? 'linha' : 'linhas'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('parecer')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'parecer'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          Fundamentação & Estratégia
        </button>

        <button
          onClick={() => setActiveTab('clausulas')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'clausulas'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Auditoria de Cláusulas & Minutas ({currentReport.clausulas?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('textoCompleto')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'textoCompleto'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Parecer Completo (Texto)
        </button>
      </div>

      {/* TAB 0: PLANILHA DE AUDITORIA & MATRIZ DE CONTRATOS (COLUNAS A A F) */}
      {activeTab === 'planilha' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          {/* Top Bar da Planilha */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Matriz de Auditoria Contratual (Planilha Gerencial)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Colunas A a F
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-white">
                  {currentReport.idContrato || 'CTR'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Estruturada exatamente conforme o modelo da planilha corporativa. Copie com 1 clique (Ctrl+V) ou baixe em formato nativo do Excel.
              </p>
            </div>

            {/* Ações de Exportação */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              <button
                onClick={handleCopiarParaExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-sm active:scale-98"
                title="Copiar todas as linhas das colunas A a F (Ctrl+V no Excel)"
              >
                <Copy className="w-4 h-4 text-slate-950" />
                Copiar p/ Excel (Ctrl+V)
              </button>

              <button
                onClick={handleExportarExcel}
                disabled={isExportingExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                title="Baixar planilha real do Excel (.xlsx) com células ajustadas"
              >
                <FileDown className="w-4 h-4 text-emerald-400" />
                {isExportingExcel ? 'Gerando...' : 'Baixar Excel (.xlsx)'}
              </button>

              <button
                onClick={handleExportarCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs"
                title="Baixar arquivo CSV compatível com Excel em Português (ponto e vírgula com UTF-8 BOM)"
              >
                Baixar .CSV
              </button>
            </div>
          </div>

          {/* Seletor de Modo: Apenas Este Contrato vs Matriz Consolidada */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Visualização:</span>
              <div className="inline-flex bg-white rounded-lg p-1 border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setFiltroPlanilha('atual')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    filtroPlanilha === 'atual'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Contrato Atual ({currentReport.idContrato || 'CTR'} • {linhasContratoAtual.length} linhas)
                </button>
                <button
                  onClick={() => setFiltroPlanilha('consolidada')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    filtroPlanilha === 'consolidada'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Matriz Consolidada ({matrizConsolidada.length} linhas • {contratosUnicos.length} CTRs)
                </button>
              </div>
            </div>

            {filtroPlanilha === 'consolidada' && matrizConsolidada.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">
                  CTRs na matriz: <strong>{contratosUnicos.join(', ')}</strong>
                </span>
                <button
                  onClick={handleLimparMatriz}
                  className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  title="Limpar histórico da matriz consolidada"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Matriz
                </button>
              </div>
            )}
          </div>

          {/* Guia das 6 Colunas da Planilha */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Coluna A</span>
              <span className="font-bold text-slate-900">ID Contrato</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Ex: CTR 02, CTR 03...</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">Coluna B</span>
              <span className="font-bold text-slate-900">Tipo / Objeto</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Objeto auditado</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-600 block">Coluna C</span>
              <span className="font-bold text-slate-900">Cláusula Auditada</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Número e tema</p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-200">
              <span className="text-[10px] uppercase font-bold text-red-800 block">Coluna D</span>
              <span className="font-bold text-slate-900">Diagnóstico / Vício</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Risco e armadilha</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Coluna E</span>
              <span className="font-bold text-slate-900">Redação Blindada</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Minuta protetiva</p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200">
              <span className="text-[10px] uppercase font-bold text-purple-800 block">Coluna F</span>
              <span className="font-bold text-slate-900">Fundamentação</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Legislação e artigos</p>
            </div>
          </div>

          {/* TABELA PRINCIPAL DA PLANILHA */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider divide-x divide-slate-800">
                  <th className="p-3 text-center w-12 bg-slate-950">#</th>
                  <th className="p-3 w-28 text-amber-300">Coluna A: ID Contrato</th>
                  <th className="p-3 w-44">Coluna B: Tipo / Objeto</th>
                  <th className="p-3 w-44">Coluna C: Cláusula Auditada</th>
                  <th className="p-3 min-w-[260px] text-red-200">Coluna D: Diagnóstico / Vício</th>
                  <th className="p-3 min-w-[320px] text-emerald-300">Coluna E: Redação Blindada (Sugestão)</th>
                  <th className="p-3 min-w-[200px] text-purple-200">Coluna F: Fundamentação Legal</th>
                  {filtroPlanilha === 'consolidada' && (
                    <th className="p-3 w-16 text-center">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {linhasExibicao.map((linha, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/80 transition-colors divide-x divide-slate-100 align-top"
                  >
                    {/* Linha # */}
                    <td className="p-3 text-center font-mono text-slate-400 font-bold bg-slate-50/50">
                      {idx + 1}
                    </td>

                    {/* Coluna A: ID Contrato */}
                    <td className="p-3">
                      <span className="inline-block px-2.5 py-1 bg-slate-900 text-amber-400 font-mono font-bold rounded-md shadow-2xs text-[11px]">
                        {linha.idContrato || 'CTR'}
                      </span>
                    </td>

                    {/* Coluna B: Tipo / Objeto */}
                    <td className="p-3 text-slate-800 font-medium leading-relaxed">
                      {linha.tipoObjeto || currentReport.tipoObjeto || 'Instrumento Contratual'}
                    </td>

                    {/* Coluna C: Cláusula Auditada */}
                    <td className="p-3">
                      <div className="font-bold text-slate-900 leading-snug">
                        {linha.clausulaAuditada}
                      </div>
                      {linha.grauRisco && (
                        <span
                          className={`inline-block mt-1.5 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                            linha.grauRisco === 'Crítico'
                              ? 'bg-red-100 text-red-800'
                              : linha.grauRisco === 'Alto'
                              ? 'bg-orange-100 text-orange-800'
                              : linha.grauRisco === 'Médio'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Risco {linha.grauRisco}
                        </span>
                      )}
                    </td>

                    {/* Coluna D: Diagnóstico / Vício */}
                    <td className="p-3 text-slate-800 leading-relaxed bg-red-50/20">
                      <div className="font-medium text-slate-900 whitespace-pre-wrap">
                        {linha.diagnosticoVicio}
                      </div>
                    </td>

                    {/* Coluna E: Redação Blindada (Sugestão) */}
                    <td className="p-3 bg-emerald-50/20">
                      <div className="relative group">
                        <div className="font-mono text-[11px] text-emerald-950 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/80 whitespace-pre-wrap leading-relaxed">
                          {linha.redacaoBlindada}
                        </div>
                        <button
                          onClick={() => handleCopiarMinutaLinha(linha, idx)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                          title="Copiar apenas esta minuta blindada"
                        >
                          {copiedRowIdx === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {copiedRowIdx === idx ? 'Copiada!' : 'Copiar minuta'}
                        </button>
                      </div>
                    </td>

                    {/* Coluna F: Fundamentação Legal */}
                    <td className="p-3 text-slate-700 leading-relaxed bg-purple-50/10">
                      <span className="inline-block px-2 py-1 bg-purple-50 text-purple-900 rounded font-medium border border-purple-200/60 text-[11px]">
                        {linha.fundamentacaoLegal}
                      </span>
                    </td>

                    {/* Ações na Matriz Consolidada */}
                    {filtroPlanilha === 'consolidada' && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoverCTR(linha.idContrato)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors"
                          title={`Remover contrato ${linha.idContrato} da matriz`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dica de Integração com o Excel / Google Sheets */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>Como colar no Excel:</strong> Clique em{' '}
                <button
                  onClick={handleCopiarParaExcel}
                  className="font-bold underline text-emerald-900 hover:text-black"
                >
                  "Copiar p/ Excel"
                </button>
                , abra sua planilha do Excel ou Google Sheets, selecione a primeira célula da Coluna A e pressione{' '}
                <kbd className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded font-mono font-bold text-slate-900 shadow-2xs">
                  Ctrl + V
                </kbd>
                . Todas as 6 colunas serão preenchidas automaticamente alinhadas!
              </div>
            </div>
            <button
              onClick={handleExportarExcel}
              disabled={isExportingExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-2xs shrink-0"
            >
              <FileDown className="w-3.5 h-3.5" />
              Baixar .xlsx
            </button>
          </div>

          {/* Campo de Interação com a IA na Planilha */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-900">
                  Ajustar Colunas, Vícios ou Minutas Blindadas desta Planilha com o Agente de IA:
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="text-[11px] text-amber-800 hover:underline font-bold"
              >
                Ir para a Consultoria Completa →
              </button>
            </div>
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ex: 'Ajuste a redação blindada da Cláusula 3ª para limitar juros', 'Mude o diagnóstico da Coluna D'..."
                className="flex-1 px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 bg-white"
                disabled={chatLoading || isRefining}
              />
              <button
                type="submit"
                disabled={chatLoading || isRefining || !chatInput.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Enviar à IA</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: CONSULTORIA INTERATIVA & REFINAMENTO COM O AGENTE */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          {/* Header & Sincronização */}
          <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  Consultoria & Aprimoramento com Agente Jurídico
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Direito Empresarial Brasileiro
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Converse com o advogado, tire dúvidas, solicite ajustes em cláusulas e alinhe a tese negocial. Quando os termos estiverem conforme seu entendimento, atualize o parecer e emita o PDF.
              </p>
            </div>

            <button
              onClick={() => handleRefineReport()}
              disabled={isRefining || chatMessages.length <= 1}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl shadow-sm transition-all disabled:opacity-50 shrink-0"
            >
              {isRefining ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Wand2 className="w-4 h-4 text-slate-950" />}
              {isRefining ? 'Atualizando Parecer...' : '✨ Sincronizar Parecer com a Conversa'}
            </button>
          </div>

          {/* Banner de Orientações Rápidas do Fluxo */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Como funciona o refinamento:</strong> Conforme você pede alterações ou esclarecimentos, você pode incorporá-los ao relatório formal clicando no botão acima.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-amber-400 text-xs font-bold rounded-lg shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Emitir Relatório Final (PDF)
              </button>
            </div>
          </div>

          {/* Quick Chat Suggestions / Prompts de Refinamento */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Sugestões Rápidas de Ajuste Negocial & Consultoria:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                'Ajuste a cláusula penal para 10% com base no art. 413 do CC',
                'Flexibilize o aviso prévio de rescisão para 45 dias sem multa',
                'Exija seguro garantia ou fiança bancária no lugar de caução',
                'Como os documentos probatórios anexados fortalecem nossa posição?',
                'Redija uma Notificação Extrajudicial com base nas provas apresentadas',
                'Está tudo conforme meu entendimento. Atualize o parecer oficial!',
              ].map((sugestao, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (sugestao.includes('Atualize o parecer')) {
                      handleRefineReport('O cliente informou que está de acordo com as deliberações. Formalize o parecer oficial.');
                    } else {
                      setChatInput(sugestao);
                    }
                  }}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium text-left"
                >
                  + {sugestao}
                </button>
              ))}
            </div>
          </div>

          {/* Message History */}
          <div className="space-y-4 min-h-[300px] max-h-[550px] overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-br-none'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1.5 text-[10px] opacity-75 border-b pb-1 border-slate-200/50">
                    <span className="font-bold flex items-center gap-1">
                      {msg.sender === 'user' ? (
                        <>Você (Cliente / Solicitante)</>
                      ) : (
                        <>
                          <Scale className="w-3 h-3 text-amber-600" />
                          Advogado Empresarial Sênior
                        </>
                      )}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 italic p-3 bg-white rounded-xl border border-slate-200 w-fit">
                <svg
                  className="animate-spin h-4 w-4 text-amber-600"
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
                O advogado está formulando a resposta com fundamentação jurídica...
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ex: 'Reduza a multa para 10%' ou 'Como rebater o argumento da contraparte?'..."
              className="flex-1 px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-slate-900 bg-white"
              disabled={chatLoading || isRefining}
            />
            <button
              type="submit"
              disabled={chatLoading || isRefining || !chatInput.trim()}
              className="px-5 py-3 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Perguntar</span>
            </button>
          </form>

          {/* Chamada para Ação Final do Relatório */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 font-medium">
              A conversa atendeu às suas necessidades e está conforme seu entendimento?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRefineReport()}
                disabled={isRefining || chatMessages.length <= 1}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-lg transition-colors text-xs flex items-center gap-1"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                Atualizar Parecer
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-amber-400 font-bold rounded-lg transition-colors text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                Emitir Relatório Final (PDF)
              </button>
            </div>
          </div>

          {/* MATRIZ VINCULADA (COLUNAS A A F) - MIX INTEGRADO NA CONSULTORIA */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Planilha Gerencial Vinculada a esta Análise
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Colunas A a F
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {linhasExibicao.length} linha(s) com ID {currentReport.idContrato || 'CTR'}, Vício e Redação Blindada.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopiarParaExcel}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold shadow-2xs transition-colors"
                  title="Copiar colunas A a F para colar com Ctrl+V no Excel"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copiar p/ Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportarExcel}
                  disabled={isExportingExcel}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Baixar .xlsx</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('planilha')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                >
                  <span>Ver Planilha Completa</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </button>
              </div>
            </div>

            {/* Cards Resumo das Linhas da Planilha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {linhasExibicao.slice(0, 4).map((linha, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-900 text-amber-400 rounded">
                      Col A: {linha.idContrato}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[170px]" title={linha.tipoObjeto}>
                      {linha.tipoObjeto}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-[11px] truncate">
                    Col C: {linha.clausulaAuditada}
                  </div>
                  <div className="text-[11px] text-red-900 bg-red-50/70 p-2 rounded border border-red-100 line-clamp-2">
                    <strong className="text-red-700">Col D (Vício):</strong> {linha.diagnosticoVicio}
                  </div>
                  <div className="text-[11px] text-emerald-950 bg-emerald-50/70 p-2 rounded border border-emerald-100 font-mono line-clamp-2">
                    <strong className="text-emerald-800">Col E (Blindada):</strong> {linha.redacaoBlindada}
                  </div>
                </div>
              ))}
            </div>

            {linhasExibicao.length > 4 && (
              <div className="mt-2.5 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('planilha')}
                  className="text-xs text-emerald-800 font-bold hover:underline"
                >
                  + Ver todas as {linhasExibicao.length} linhas na aba Planilha de Auditoria (Colunas A a F) →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FUNDAMENTAÇÃO & ESTRATÉGIA NEGOCIAL */}
      {activeTab === 'parecer' && (
        <div className="space-y-6">
          {/* Fundamentação Legal em Destaque */}
          {currentReport.fundamentacaoDestaque && currentReport.fundamentacaoDestaque.length > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-600" />
                Embasamento na Legislação e Jurisprudência Brasileira
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentReport.fundamentacaoDestaque.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                  >
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-slate-200/80 text-slate-900 text-[11px] font-bold rounded mb-2">
                        {item.norma}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        {item.aplicacao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estratégia Negocial & Plano de Ação Recomendado */}
          {currentReport.estrategiaNegocial && currentReport.estrategiaNegocial.length > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                Estratégia de Negociação & Plano de Ação Recomendado
              </h3>
              <div className="space-y-3">
                {currentReport.estrategiaNegocial.map((passo, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium text-xs md:text-sm">{passo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDITORIA DE CLÁUSULAS & MINUTAS BLINDADAS */}
      {activeTab === 'clausulas' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Total de Cláusulas Auditadas: {currentReport.clausulas?.length || 0}
            </span>
            <button
              onClick={() => setActiveTab('chat')}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Solicitar Ajuste em Cláusula no Chat
            </button>
          </div>

          {currentReport.clausulas?.map((clausula, idx) => {
            const getRiscoBadgeClass = (risco: string) => {
              switch (risco) {
                case 'Baixo':
                  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                case 'Médio':
                  return 'bg-amber-50 text-amber-800 border-amber-200';
                case 'Alto':
                  return 'bg-orange-50 text-orange-800 border-orange-200';
                case 'Crítico':
                  return 'bg-red-50 text-red-800 border-red-200';
                default:
                  return 'bg-slate-50 text-slate-800 border-slate-200';
              }
            };

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 transition-all"
              >
                {/* Cabeçalho da Cláusula */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm md:text-base font-bold text-slate-900">
                      {clausula.numero} — {clausula.titulo}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider self-start sm:self-auto ${getRiscoBadgeClass(
                      clausula.grauRisco
                    )}`}
                  >
                    Risco {clausula.grauRisco}
                  </span>
                </div>

                {/* Texto original identificado no documento */}
                {clausula.textoOriginal && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 italic leading-relaxed">
                    <span className="not-italic font-bold text-[10px] uppercase text-slate-400 block mb-1">
                      Redação Original Identificada no Instrumento:
                    </span>
                    "{clausula.textoOriginal}"
                  </div>
                )}

                {/* Diagnóstico e Fundamentação */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      Diagnóstico do Risco Jurídico
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {clausula.diagnostico}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-slate-600" />
                      Fundamentação Legal (Código Civil / STJ)
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {clausula.fundamentacaoLegal}
                    </p>
                  </div>
                </div>

                {/* Redação Sugerida / Minuta Blindada */}
                {clausula.redacaoSugerida && (
                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Minuta de Cláusula Blindada Recomendada (Contraproposta):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyClause(clausula.redacaoSugerida, idx)}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-300 rounded-md transition-all shadow-sm"
                      >
                        {copiedClauseIdx === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Copiada!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Cláusula
                          </>
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-xs text-slate-900 bg-white p-3.5 rounded-lg border border-emerald-100 leading-relaxed whitespace-pre-line">
                      {clausula.redacaoSugerida}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: PARECER COMPLETO (TEXTO FORMATADO) */}
      {activeTab === 'textoCompleto' && (
        <div className="bg-white rounded-2xl p-6 md:p-10 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Parecer Formal em Formato Textual</h3>
              <p className="text-xs text-slate-500">Pronto para arquivamento, e-mail corporativo ou ata de reunião.</p>
            </div>
            <button
              onClick={handleCopyFullReport}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAll ? 'Copiado!' : 'Copiar Texto'}
            </button>
          </div>

          <div className="font-mono text-xs md:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-200 max-h-[700px] overflow-y-auto">
            {currentReport.relatorioMarkdownCompleto || currentReport.resumoExecutivo}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECEPTÁCULO OFICIAL PARA EXPORTAÇÃO EM PDF E IMPRESSÃO DE ALTA DEFINIÇÃO   */}
      {/* Contém TODAS as abas consolidadas, histórico e termo formal de aprovação   */}
      {/* ========================================================================= */}
      <div
        id="report-print-container"
        className="hidden print:block bg-white text-slate-900 p-8 md:p-12 font-sans max-w-4xl mx-auto"
      >
        {/* Cabeçalho Oficial Timbrado */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end avoid-break">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-2xl tracking-tight text-slate-950">
                LEGALOPS BRASIL
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-white font-bold rounded uppercase">
                Advocacia Empresarial
              </span>
            </div>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Consultoria Estratégica, Auditoria Contratual e Blindagem de Riscos Corporativos
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-black text-sm text-slate-900 uppercase">PARECER TÉCNICO-JURÍDICO</p>
            <p className="font-medium mt-0.5">Versão v{currentReport.versaoParecer || 1}.0 • {new Date().toLocaleDateString('pt-BR')}</p>
            <p className="text-[10px] text-slate-400 font-mono">DOC-{Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        {/* Tarja de Aviso de Responsabilidade Técnica */}
        <div className="bg-amber-50/80 border border-amber-300/80 p-3 rounded-lg mb-6 avoid-break">
          <p className="text-[11px] text-amber-950 font-bold uppercase tracking-wider mb-0.5">
            Nota de Governança & Validação Profissional:
          </p>
          <p className="text-[11px] text-amber-900 leading-relaxed">
            Este relatório constitui instrumento de apoio técnico-jurídico gerado para subsidiar a tomada de decisão corporativa. As recomendações, diagnósticos, deliberações e minutas blindadas abaixo apresentados foram calibrados na consultoria e devem ser formalmente chancelados pelo advogado responsável antes da subscrição definitiva com a contraparte.
          </p>
        </div>

        <div className="space-y-6 text-xs leading-relaxed">
          {/* Identificação do Instrumento e Painel de Risco */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 avoid-break">
            <h2 className="text-base font-bold text-slate-950 mb-2">{currentReport.titulo}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-600">
                  <strong className="text-slate-900">Partes & Objeto:</strong> {currentReport.partesIdentificadas}
                </p>
                <p className="text-slate-600 mt-1">
                  <strong className="text-slate-900">Data de Análise:</strong> {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-slate-600">
                  <strong className="text-slate-900">Índice de Exposição de Risco:</strong>
                </p>
                <div className="inline-flex items-center gap-2 mt-1">
                  <span className="text-base font-black text-slate-900">Score {currentReport.scoreRisco}/100</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white">
                    Risco {currentReport.classificacaoRisco}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ajustes e Deliberações Incorporadas na Consultoria */}
          {currentReport.ajustesRealizadosNaConversa && currentReport.ajustesRealizadosNaConversa.length > 0 && (
            <div className="border-t border-slate-200 pt-4 avoid-break">
              <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wider mb-2 flex items-center gap-1.5">
                Deliberações e Ajustes Incorporados na Consultoria Interativa (v{currentReport.versaoParecer || 1}.0)
              </h3>
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1">
                {currentReport.ajustesRealizadosNaConversa.map((ajuste, i) => (
                  <p key={i} className="flex items-start gap-1.5 font-medium">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{ajuste}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 1. Síntese Executiva & Diagnóstico Estratégico (Aba 1) */}
          <div className="border-t border-slate-200 pt-4 avoid-break">
            <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wider mb-2 flex items-center gap-1.5">
              1. Síntese Executiva & Diagnóstico Estratégico
            </h3>
            <p className="text-slate-800 text-xs md:text-sm leading-relaxed whitespace-pre-line text-justify">
              {currentReport.resumoExecutivo}
            </p>
          </div>

          {/* 2. Confronto Probatório com Documentos Corroborativos (se houver) */}
          {(currentReport.cruzamentoCorroborativo || (currentReport.documentosCorroborativosAnalisados && currentReport.documentosCorroborativosAnalisados.length > 0)) && (
            <div className="border-t border-slate-200 pt-4 avoid-break">
              <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wider mb-2">
                2. Confronto Probatório com Documentos Corroborativos
              </h3>
              {currentReport.documentosCorroborativosAnalisados && currentReport.documentosCorroborativosAnalisados.length > 0 && (
                <div className="mb-2">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    Documentos e Evidências Confrontadas ({currentReport.documentosCorroborativosAnalisados.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentReport.documentosCorroborativosAnalisados.map((doc, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-950 rounded text-[11px] font-medium">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {currentReport.cruzamentoCorroborativo && (
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-indigo-950 leading-relaxed text-xs">
                  {currentReport.cruzamentoCorroborativo}
                </div>
              )}
            </div>
          )}

          {/* 3. Principais Riscos e Armadilhas Contratuais */}
          {currentReport.principaisRiscos && currentReport.principaisRiscos.length > 0 && (
            <div className="border-t border-slate-200 pt-4 avoid-break">
              <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wider mb-2">
                3. Principais Armadilhas & Riscos Jurídicos Mapeados
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {currentReport.principaisRiscos.map((risco, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-red-50/70 border border-red-200/80 rounded-lg text-xs text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-medium leading-relaxed">{risco}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Embasamento Legal e Jurisprudência Aplicável (Aba 1) */}
          {currentReport.fundamentacaoDestaque && currentReport.fundamentacaoDestaque.length > 0 && (
            <div className="border-t border-slate-200 pt-4 avoid-break">
              <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wider mb-2">
                4. Embasamento Legal e Jurisprudência Brasileira (Código Civil / STJ)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentReport.fundamentacaoDestaque.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-bold text-slate-900 text-xs block mb-1">
                      {item.norma}
                    </span>
                    <p className="text-slate-700 text-xs leading-relaxed">{item.aplicacao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Auditoria Cláusula a Cláusula & Minutas de Redação Blindada (Aba 2 Completa) */}
          {currentReport.clausulas && currentReport.clausulas.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between items-center mb-3 avoid-break">
                <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wider">
                  5. Auditoria Cláusula a Cláusula & Minutas de Redação Blindada
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  Total de {currentReport.clausulas.length} cláusula(s) auditada(s)
                </span>
              </div>

              <div className="space-y-4">
                {currentReport.clausulas.map((c, i) => (
                  <div key={i} className="border border-slate-200 p-4 rounded-xl bg-white shadow-2xs avoid-break">
                    {/* Header da Cláusula */}
                    <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2 mb-2.5">
                      <div>
                        <span className="font-bold text-slate-950 text-xs">
                          {c.numero} — {c.titulo}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider bg-slate-100 text-slate-800 border-slate-300">
                        Risco {c.grauRisco}
                      </span>
                    </div>

                    {/* Texto original identificado */}
                    {c.textoOriginal && (
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 italic text-[11px] mb-2 leading-relaxed">
                        <strong className="not-italic text-slate-500 block text-[10px] uppercase font-bold mb-0.5">
                          Redação Original Identificada no Contrato:
                        </strong>
                        "{c.textoOriginal}"
                      </div>
                    )}

                    {/* Diagnóstico e Fundamentação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-2.5">
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                        <strong className="text-red-900 block text-[10px] uppercase font-bold mb-1">
                          Diagnóstico do Vício / Risco Jurídico:
                        </strong>
                        <p className="text-slate-800 leading-relaxed font-medium">{c.diagnostico}</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                        <strong className="text-slate-700 block text-[10px] uppercase font-bold mb-1">
                          Fundamentação Legal Aplicável:
                        </strong>
                        <p className="text-slate-800 leading-relaxed font-medium">{c.fundamentacaoLegal}</p>
                      </div>
                    </div>

                    {/* Minuta Blindada Sugerida */}
                    {c.redacaoSugerida && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-300/80 rounded-lg">
                        <strong className="text-emerald-950 block text-[10px] uppercase font-bold mb-1">
                          Minuta de Redação Blindada Recomendada (Contraproposta Negocial):
                        </strong>
                        <p className="text-slate-950 font-mono text-[11px] leading-relaxed whitespace-pre-line bg-white p-2.5 rounded border border-emerald-200">
                          {c.redacaoSugerida}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Estratégia de Negociação & Recomendações Práticas (Aba 1) */}
          {currentReport.estrategiaNegocial && currentReport.estrategiaNegocial.length > 0 && (
            <div className="border-t border-slate-200 pt-4 avoid-break">
              <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wider mb-2">
                6. Estratégia de Negociação & Plano de Ação Recomendado
              </h3>
              <div className="space-y-2">
                {currentReport.estrategiaNegocial.map((passo, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{passo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Consultoria Jurídica Complementar (Histórico de Discussão da Sessão) */}
          {chatMessages && chatMessages.length > 0 && (
            <div className="border-t border-slate-200 pt-4 avoid-break">
              <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wider mb-2">
                7. Consultoria Jurídica Complementar & Histórico de Alinhamentos
              </h3>
              <div className="space-y-2.5">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-slate-100 border-slate-300 font-medium text-slate-900'
                        : 'bg-amber-50/60 border-amber-200 text-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                        {msg.sender === 'user' ? 'Instrução / Dúvida do Solicitante:' : 'Parecer & Minuta do Advogado:'}
                      </span>
                      <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Parecer Formal em Formato Textual (Aba 4) */}
          {currentReport.relatorioMarkdownCompleto && (
            <div className="border-t border-slate-200 pt-4 avoid-break">
              <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wider mb-2">
                8. Parecer Jurídico Formal Consolidado
              </h3>
              <div className="font-mono text-[11px] text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed">
                {currentReport.relatorioMarkdownCompleto}
              </div>
            </div>
          )}

          {/* 9. TERMO DE VALIDAÇÃO, CHANCELA E APROVAÇÃO DO ADVOGADO RESPONSÁVEL */}
          <div className="border-2 border-slate-900 p-5 rounded-xl mt-8 bg-slate-50/50 avoid-break">
            <h3 className="font-black text-slate-950 text-sm uppercase tracking-widest text-center border-b border-slate-300 pb-2 mb-4">
              9. TERMO DE VALIDAÇÃO E APROVAÇÃO DO ADVOGADO RESPONSÁVEL
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed mb-4 text-justify">
              Declaro que examinei o teor das análises, diagnósticos de vulnerabilidades e minutas blindadas sugeridas neste parecer técnico-jurídico corporativo, manifestando a seguinte conclusão:
            </p>

            <div className="space-y-2 mb-6 text-xs text-slate-900">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-900 rounded-sm inline-block"></span>
                <span><strong>APROVADO INTEGRALMENTE:</strong> Minuta contratual apta para assinatura sem alterações.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-900 rounded-sm inline-block"></span>
                <span><strong>APROVADO COM RESSALVAS:</strong> Aprovado condicionado à substituição pelas Minutas Blindadas recomendadas.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-900 rounded-sm inline-block"></span>
                <span><strong>REJEITADO / DEVOLVIDO:</strong> Minuta com risco crítico. Exige renegociação integral com a contraparte.</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 mb-6">
              <p className="text-[11px] font-bold text-slate-700 uppercase mb-1">Observações e Ressalvas Adicionais do Advogado:</p>
              <div className="border border-slate-300 rounded p-2 h-16 bg-white"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-300 text-xs">
              <div className="space-y-1">
                <div className="border-b border-slate-900 w-full mb-1"></div>
                <p className="font-bold text-slate-900">Assinatura do Advogado(a) Responsável</p>
                <p className="text-slate-600">Inscrição na OAB: _________________________</p>
              </div>
              <div className="space-y-1 sm:text-right">
                <div className="border-b border-slate-900 w-full mb-1"></div>
                <p className="font-bold text-slate-900">Data de Aprovação e Visto Jurídico</p>
                <p className="text-slate-600">Em _____ / _____ / 202____</p>
              </div>
            </div>
          </div>

          {/* Rodapé Oficial da Impressão */}
          <div className="border-t-2 border-slate-900 pt-4 mt-8 text-center text-[10px] text-slate-500 avoid-break">
            <p className="font-bold text-slate-700 uppercase tracking-widest">
              LegalOps Brasil • Consultoria e Auditoria Jurídica Corporativa de Alta Performance
            </p>
            <p className="mt-0.5">
              Documento estritamente confidencial e de uso corporativo interno. Fundamentado na Legislação Civil e Processual Brasileira.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;
