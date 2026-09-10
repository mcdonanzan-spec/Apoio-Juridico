import React, { useState } from 'react';
import { StructuredAnalysisResult, ChatMessage } from '../types';
import { sendChatQuestion } from '../services/geminiService';
import {
  Scale,
  ShieldAlert,
  FileText,
  Copy,
  Check,
  Download,
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
  Layers
} from 'lucide-react';

interface ReportDisplayProps {
  report: StructuredAnalysisResult;
  onNewAnalysis: () => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, onNewAnalysis }) => {
  const [activeTab, setActiveTab] = useState<'parecer' | 'clausulas' | 'chat' | 'textoCompleto'>('parecer');
  const [copiedClauseIdx, setCopiedClauseIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Chat follow-up state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

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

  const scoreInfo = getScoreBadge(report.scoreRisco);

  const handleCopyClause = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedClauseIdx(idx);
    setTimeout(() => setCopiedClauseIdx(null), 2500);
  };

  const handleCopyFullReport = () => {
    navigator.clipboard.writeText(report.relatorioMarkdownCompleto || report.resumoExecutivo);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-print-container');
    if (!element) return;

    // @ts-ignore
    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin: [12, 12, 12, 12],
        filename: `Parecer_Juridico_Corporativo_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };
      // @ts-ignore
      html2pdf().set(opt).from(element).save();
    } else {
      window.print();
    }
  };

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = chatInput.trim();
    if (!query || chatLoading) return;

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
        report.resumoExecutivo +
          '\n' +
          (report.cruzamentoCorroborativo ? `Cruzamento com documentos probatórios: ${report.cruzamentoCorroborativo}\n` : '') +
          (report.clausulas?.map((c) => `${c.numero}: ${c.diagnostico}`).join('\n') || ''),
        report.relatorioMarkdownCompleto,
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

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <button
          onClick={onNewAnalysis}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Nova Análise de Documento
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyFullReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiedAll ? 'Copiado!' : 'Copiar Parecer'}
          </button>

          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Exportar em PDF
          </button>
        </div>
      </div>

      {/* Main Executive Summary Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-amber-50 text-amber-900 text-[11px] font-extrabold uppercase tracking-wider rounded-md border border-amber-200">
                Parecer Jurídico Empresarial
              </span>
              <span className="text-xs text-slate-400">
                Data: {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
              {report.titulo || 'Auditoria & Consultoria Jurídica'}
            </h2>
            <p className="text-slate-500 text-xs flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <strong>Partes & Objeto:</strong> {report.partesIdentificadas || 'Partes e instrumento analisados'}
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
              <span className="text-2xl font-black leading-none">{report.scoreRisco}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* Resumo Executivo */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            Síntese Executiva & Diagnóstico Estratégico
          </h3>
          <p className="text-sm md:text-base text-slate-800 leading-relaxed font-normal bg-slate-50 p-5 rounded-xl border border-slate-200/80">
            {report.resumoExecutivo}
          </p>
        </div>

        {/* Bloco de Confronto / Cruzamento com Documentos Corroborativos */}
        {(report.cruzamentoCorroborativo || (report.documentosCorroborativosAnalisados && report.documentosCorroborativosAnalisados.length > 0)) && (
          <div className="mt-6 p-5 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-700" />
                Confronto Probatório & Documentos Corroborativos Analisados
              </h3>
              {report.documentosCorroborativosAnalisados && report.documentosCorroborativosAnalisados.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-200/60 text-indigo-900 rounded-md">
                  {report.documentosCorroborativosAnalisados.length} documento(s) confrontado(s)
                </span>
              )}
            </div>

            {report.documentosCorroborativosAnalisados && report.documentosCorroborativosAnalisados.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {report.documentosCorroborativosAnalisados.map((docNome, i) => (
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

            {report.cruzamentoCorroborativo && (
              <p className="text-xs md:text-sm text-indigo-950 leading-relaxed font-medium bg-white/80 p-3.5 rounded-lg border border-indigo-100">
                {report.cruzamentoCorroborativo}
              </p>
            )}
          </div>
        )}

        {/* Principais Riscos Identificados */}
        {report.principaisRiscos && report.principaisRiscos.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Armadilhas & Riscos Críticos Identificados:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {report.principaisRiscos.map((risco, idx) => (
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
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 gap-2 no-print overflow-x-auto">
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
          Auditoria de Cláusulas & Minutas ({report.clausulas?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-600" />
          Consultoria Interativa / Chat
          {chatMessages.length > 0 && (
            <span className="px-1.5 py-0.2 bg-slate-900 text-white rounded-full text-[10px]">
              {chatMessages.length}
            </span>
          )}
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

      {/* TAB 1: FUNDAMENTAÇÃO & ESTRATÉGIA NEGOCIAL */}
      {activeTab === 'parecer' && (
        <div className="space-y-6">
          {/* Fundamentação Legal em Destaque */}
          {report.fundamentacaoDestaque && report.fundamentacaoDestaque.length > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-600" />
                Embasamento na Legislação e Jurisprudência Brasileira
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.fundamentacaoDestaque.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                  >
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-slate-200/80 text-slate-900 text-[11px] font-bold rounded mb-2">
                        {item.norma}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">{item.aplicacao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estratégia Negocial & Próximos Passos */}
          {report.estrategiaNegocial && report.estrategiaNegocial.length > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Estratégia Negocial & Recomendações Práticas do Advogado
              </h3>
              <div className="space-y-3">
                {report.estrategiaNegocial.map((passo, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      {idx + 1}
                    </div>
                    <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-medium">
                      {passo}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUDITORIA CLÁUSULA A CLÁUSULA COM MINUTAS DE CONTRA-PROPOSTA */}
      {activeTab === 'clausulas' && (
        <div className="space-y-6">
          {(!report.clausulas || report.clausulas.length === 0) && (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
              <p>Nenhuma cláusula pontual isolada encontrada para este documento.</p>
            </div>
          )}

          {report.clausulas?.map((clausula, idx) => {
            const riskColors =
              {
                Baixo: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                Médio: 'bg-amber-50 text-amber-800 border-amber-300',
                Alto: 'bg-orange-50 text-orange-800 border-orange-300',
                Crítico: 'bg-red-50 text-red-800 border-red-300',
              }[clausula.grauRisco] || 'bg-slate-50 text-slate-800 border-slate-300';

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4"
              >
                {/* Header da Cláusula */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{clausula.numero}</h4>
                      <p className="text-xs text-slate-500 font-semibold">{clausula.titulo}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${riskColors}`}>
                    Risco {clausula.grauRisco}
                  </span>
                </div>

                {/* Texto original identificado */}
                {clausula.textoOriginal && (
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 font-mono leading-relaxed">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Trecho / Redação Identificada no Contrato:
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

      {/* TAB 3: CONSULTORIA INTERATIVA / CHAT COM O ADVOGADO */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              Consultoria Interativa com o Advogado Empresarial
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Faça perguntas pontuais sobre o documento analisado e os anexos corroborativos, peça minutas de notificações, esclarecimentos sobre jurisprudência ou simulações negociais.
            </p>
          </div>

          {/* Quick Chat Suggestions */}
          <div className="flex flex-wrap gap-2">
            {[
              'Como os documentos corroborativos fortalecem nossa tese jurídica?',
              'Redija uma Notificação Extrajudicial citando as provas anexadas',
              'Qual a probabilidade de anulação judicial da cláusula penal?',
              'Elabore uma Cláusula de Rescisão com aviso prévio de 30 dias',
            ].map((sugestao, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setChatInput(sugestao);
                }}
                className="text-[11px] px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium text-left"
              >
                + {sugestao}
              </button>
            ))}
          </div>

          {/* Message History */}
          <div className="space-y-4 min-h-[220px] max-h-[500px] overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200">
            {chatMessages.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <Scale className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Nenhuma pergunta enviada ainda. Digite sua dúvida ou clique em uma das sugestões acima.
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white rounded-br-none'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-70">
                      <span className="font-bold">
                        {msg.sender === 'user' ? 'Você (Cliente)' : 'Advogado Empresarial Sênior'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))
            )}

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
              placeholder="Digite sua dúvida ou instrução jurídica sobre este documento..."
              className="flex-1 px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-slate-900 bg-white"
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-5 py-3 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Perguntar</span>
            </button>
          </form>
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
            {report.relatorioMarkdownCompleto || report.resumoExecutivo}
          </div>
        </div>
      )}

      {/* CONTAINER OCULTO DE IMPRESSÃO / PDF EXECUTIVO (A4) */}
      <div id="report-print-container" className="hidden print:block bg-white p-8 font-sans text-slate-900">
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-slate-900">
              LEGALOPS BRASIL
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Advocacia Empresarial & Consultoria Estratégica
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-bold text-slate-800">PARECER TÉCNICO-JURÍDICO</p>
            <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="space-y-6 text-xs leading-relaxed">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">{report.titulo}</h2>
            <p className="text-slate-600">
              <strong>Partes & Objeto:</strong> {report.partesIdentificadas}
            </p>
            <p className="text-slate-600">
              <strong>Classificação de Risco:</strong> {report.classificacaoRisco} (Score: {report.scoreRisco}/100)
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-2">1. Resumo Executivo</h3>
            <p className="text-slate-800">{report.resumoExecutivo}</p>
          </div>

          {/* Documentos Corroborativos na Impressão */}
          {report.cruzamentoCorroborativo && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                2. Confronto com Documentos Corroborativos
              </h3>
              <p className="text-slate-800">{report.cruzamentoCorroborativo}</p>
            </div>
          )}

          {report.principaisRiscos && report.principaisRiscos.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-2">3. Principais Armadilhas & Riscos</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-800">
                {report.principaisRiscos.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {report.clausulas && report.clausulas.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-2">4. Auditoria Cláusula a Cláusula</h3>
              <div className="space-y-4">
                {report.clausulas.map((c, i) => (
                  <div key={i} className="border border-slate-200 p-3 rounded">
                    <p className="font-bold text-slate-900">
                      {c.numero} - {c.titulo} (Risco {c.grauRisco})
                    </p>
                    {c.textoOriginal && <p className="italic text-slate-600 my-1">"{c.textoOriginal}"</p>}
                    <p className="text-slate-800 my-1">
                      <strong>Diagnóstico:</strong> {c.diagnostico}
                    </p>
                    <p className="text-slate-700 my-1">
                      <strong>Fundamentação:</strong> {c.fundamentacaoLegal}
                    </p>
                    <p className="text-emerald-900 bg-emerald-50 p-2 rounded mt-1 font-mono text-[10px]">
                      <strong>Minuta Sugerida:</strong> {c.redacaoSugerida}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.estrategiaNegocial && report.estrategiaNegocial.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-2">5. Estratégia de Negociação</h3>
              <ol className="list-decimal pl-5 space-y-1 text-slate-800">
                {report.estrategiaNegocial.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="border-t-2 border-slate-900 pt-6 mt-10 text-center text-[10px] text-slate-400">
            <p className="font-bold text-slate-600 uppercase tracking-widest">
              LegalOps Brasil • Consultoria Jurídica Corporativa de Alta Performance
            </p>
            <p className="mt-1">
              Este relatório constitui apoio técnico e diagnóstico analítico com base no ordenamento jurídico brasileiro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;
