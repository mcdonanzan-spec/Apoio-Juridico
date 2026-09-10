import React, { useState, useCallback } from 'react';
import AnalysisForm from './components/AnalysisForm';
import ReportDisplay from './components/ReportDisplay';
import { analyzeLegalDocument } from './services/geminiService';
import { LegalAnalysisInput, StructuredAnalysisResult } from './types';
import { Scale, ShieldCheck, FileCheck, Sparkles, AlertCircle, FileCode, Paperclip, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [report, setReport] = useState<StructuredAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = useCallback(async (data: LegalAnalysisInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeLegalDocument(data);
      setReport(result);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Falha na comunicação com o assistente jurídico. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const resetAnalysis = () => {
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header Corporativo Executivo */}
      <header className="bg-slate-950 text-white border-b border-slate-800 shadow-md no-print">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md">
              <Scale className="w-6 h-6 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-bold tracking-tight text-white">
                  LegalOps Brasil
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30">
                  Advogado Empresarial Sênior
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Consultoria, Auditoria de Riscos e Confronto de Documentos Probatórios • Direito Brasileiro
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-medium flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              Doc Principal (.RTF, .PDF, .DOC)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-medium flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
              Provas (.PDF, .DOC, .PPT)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              CC & STJ
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {!report && !loading && (
          <div className="mb-8 text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              Assessoria Jurídica Estratégica & Confronto Probatório
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Carregue o documento principal a ser auditado (<span className="font-semibold text-slate-900">.rtf, .pdf, .doc, .txt</span>), anexe os documentos que corroborem com a decisão (<span className="font-semibold text-indigo-700">.pdf, .doc, .ppt</span>) e receba um parecer aprofundado com blindagem jurídica e estratégia negocial.
            </p>
          </div>
        )}

        {/* Mensagem de Erro com Fechamento e Botão Tentar Novamente */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start justify-between gap-3 shadow-sm no-print">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-red-900">Aviso na Consulta Jurídica</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
                <p className="text-[11px] text-red-600 mt-1">
                  O sistema já conta com contingência automática de modelos de IA e repetição inteligente para evitar instabilidades.
                </p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-700 font-bold text-sm px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Formulário ou Exibição do Parecer */}
        {!report ? (
          <div className="max-w-4xl mx-auto">
            <AnalysisForm onSubmit={handleFormSubmit} isLoading={loading} />
          </div>
        ) : (
          <ReportDisplay report={report} onNewAnalysis={resetAnalysis} />
        )}
      </main>

      {/* Footer Profissional */}
      <footer className="mt-auto py-6 border-t border-slate-200 text-slate-500 text-xs no-print">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} LegalOps Brasil • Inteligência Jurídica para Negócios e Contratos.</p>
          <p className="text-slate-400">
            Fundamentado no Código Civil, LSA 6.404/76, Lei 4.591/64, CLT e Jurisprudência dos Tribunais Superiores (STJ/STF).
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
