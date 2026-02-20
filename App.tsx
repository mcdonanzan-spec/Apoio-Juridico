
import React, { useState, useCallback } from 'react';
import AnalysisForm from './components/AnalysisForm';
import ReportDisplay from './components/ReportDisplay';
import { analyzeLegalDocument } from './services/geminiService';
import { LegalAnalysisInput } from './types';

const App: React.FC = () => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = useCallback(async (data: LegalAnalysisInput) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await analyzeLegalDocument(data);
      setReport(result);
    } catch (err) {
      console.error(err);
      setError("Falha na comunicação com o servidor de inteligência jurídica. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  const resetAnalysis = () => {
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-slate-900 text-white py-8 mb-10 shadow-lg">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-serif">LegalOps Brasil</h1>
            <p className="text-slate-400 text-sm">Inteligência Jurídica Especializada em Incorporação e Construção Civil</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30 uppercase tracking-widest">
              Ambiente Seguro
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-6xl">
        {!report && !loading && (
          <div className="mb-10 text-center space-y-4">
            <h2 className="text-4xl font-bold text-slate-800">Análise de Riscos Automatizada</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Preencha os campos abaixo para obter um relatório executivo técnico, fundamentação legal e score de risco comparável para seus documentos jurídicos.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold">✕</button>
          </div>
        )}

        {!report ? (
          <div className="max-w-4xl mx-auto">
            <AnalysisForm onSubmit={handleFormSubmit} isLoading={loading} />
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6 no-print">
              <button 
                onClick={resetAnalysis}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Nova Análise Documental
              </button>
            </div>
            <ReportDisplay report={report} />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-20 py-8 border-t border-slate-200 no-print">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} LegalOps Brasil - Tecnologia Jurídica para Engenharia.</p>
          <p className="text-slate-300 text-xs mt-2">Fundamentado na Legislação Civil, Trabalhista e Leis de Incorporação Brasileira.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
