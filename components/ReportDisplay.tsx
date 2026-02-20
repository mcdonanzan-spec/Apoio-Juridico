
import React from 'react';

interface ReportDisplayProps {
  report: string;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  // Simple markdown-ish parser for the structure
  const sections = report.split('\n\n');

  const getScoreColor = (text: string) => {
    const score = parseInt(text.replace(/[^0-9]/g, ''));
    if (score <= 25) return 'text-green-600 bg-green-50';
    if (score <= 50) return 'text-yellow-600 bg-yellow-50';
    if (score <= 75) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-xl shadow-xl border border-slate-200 max-w-5xl mx-auto my-10 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2">LegalOps Brasil</h1>
          <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase">Assistente Jurídico Corporativo</p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-sm text-slate-500">Documento Gerado em:</p>
          <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none">
        {report.split('\n').map((line, idx) => {
          if (line.startsWith('RELATÓRIO EXECUTIVO') || line.startsWith('ANEXO TÉCNICO')) {
            return <h2 key={idx} className="text-2xl font-bold text-slate-800 mt-10 mb-4 border-l-4 border-blue-600 pl-4 uppercase tracking-tight">{line}</h2>;
          }
          if (line.startsWith('Score Numérico:')) {
             return (
               <div key={idx} className="flex items-center gap-4 my-6">
                 <span className="font-bold text-slate-700">Índice de Risco Legal:</span>
                 <span className={`px-6 py-2 rounded-full font-black text-2xl ${getScoreColor(line)} border border-current`}>
                   {line.replace('Score Numérico:', '').trim()}
                 </span>
               </div>
             );
          }
          if (line.match(/^[0-9]\. |^[A-Z][a-z]+:/)) {
            return <p key={idx} className="font-semibold text-slate-800 mt-4">{line}</p>;
          }
          if (line.startsWith('DECLARAÇÃO FINAL')) {
             return <div key={idx} className="mt-12 p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 italic text-center uppercase tracking-widest">{line}</div>;
          }
          if (line.trim() === '') return <br key={idx} />;
          
          return <p key={idx} className="text-slate-600 leading-relaxed text-sm md:text-base">{line}</p>;
        })}
      </div>

      <div className="mt-12 flex justify-center gap-4 no-print">
        <button 
          onClick={() => window.print()} 
          className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Imprimir Relatório
        </button>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(report);
            alert('Relatório copiado para a área de transferência!');
          }} 
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
          Copiar Conteúdo
        </button>
      </div>
    </div>
  );
};

export default ReportDisplay;
