
import React from 'react';

interface ReportDisplayProps {
  report: string;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  const getScoreColor = (text: string) => {
    const scoreMatch = text.match(/\d+/);
    const score = scoreMatch ? parseInt(scoreMatch[0]) : 0;
    if (score <= 25) return 'text-green-700 bg-green-50 border-green-200';
    if (score <= 50) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    if (score <= 75) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Relatorio_LegalOps_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadText = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_Executivo_${new Date().getTime()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto my-10 animate-fade-in">
      <div className="flex flex-wrap justify-end gap-3 mb-6 no-print">
        <button onClick={handleDownloadPDF} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg font-semibold text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          Baixar PDF
        </button>
        <button onClick={handleDownloadText} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-semibold text-sm shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Markdown
        </button>
      </div>

      <div id="report-content" className="bg-white p-8 md:p-16 rounded-2xl shadow-2xl border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-8 mb-10">
          <div>
            <h1 className="text-4xl font-serif text-slate-900 mb-2">LegalOps Brasil</h1>
            <p className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              Relatório de Auditoria Jurídica Digital
            </p>
          </div>
          <div className="mt-6 md:mt-0 text-right bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data de Emissão</p>
            <p className="text-sm font-mono font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          {report.split('\n').map((line, idx) => {
            const trimmedLine = line.trim();
            if (!trimmedLine && line !== '') return <div key={idx} className="h-4"></div>;

            if (trimmedLine.startsWith('# ')) {
              return <h2 key={idx} className="text-2xl font-black text-slate-900 mt-12 mb-6 border-b-4 border-slate-900 pb-2 uppercase tracking-tight">{trimmedLine.replace('# ', '')}</h2>;
            }
            if (trimmedLine.startsWith('## ')) {
              const headerText = trimmedLine.replace('## ', '');
              return <h3 key={idx} className={`text-lg font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2 ${headerText.includes('Ficha Resumo') ? 'bg-blue-50 p-3 rounded-lg border-l-4 border-blue-600' : ''}`}>
                {headerText}
              </h3>;
            }

            // Estilização Especial para Ficha Resumo (linhas com ": ")
            if (trimmedLine.includes(': ') && (trimmedLine.match(/^[0-9]\./) || trimmedLine.startsWith('- '))) {
              const [label, ...valueParts] = trimmedLine.split(': ');
              const value = valueParts.join(': ');
              return (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 py-2 border-b border-slate-50">
                  <span className="text-xs font-black text-slate-500 uppercase md:col-span-1">{label.replace(/^[0-9]\.\s*/, '').replace('- ', '')}</span>
                  <span className="text-sm text-slate-800 md:col-span-3">{value}</span>
                </div>
              );
            }

            if (trimmedLine.includes('Score Numérico:')) {
               return (
                 <div key={idx} className="flex flex-col md:flex-row items-center gap-6 my-10 p-8 bg-slate-50 rounded-2xl border border-slate-200">
                   <div className="flex-1">
                     <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Índice de Exposição a Riscos</h4>
                     <p className="text-slate-600 text-sm italic">Matriz de risco baseada em conformidade legal e impacto financeiro.</p>
                   </div>
                   <div className={`flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 shadow-inner ${getScoreColor(trimmedLine)}`}>
                     <span className="text-4xl font-black">{trimmedLine.replace(/[^0-9]/g, '')}</span>
                     <span className="text-[10px] font-bold uppercase tracking-tighter">Pontos</span>
                   </div>
                 </div>
               );
            }

            if (trimmedLine.startsWith('DECLARAÇÃO FINAL') || trimmedLine.includes('não substitui parecer jurídico formal')) {
               return (
                <div key={idx} className="mt-16 p-6 bg-amber-50 border border-amber-100 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-[0.3em] mb-2">Aviso Legal</p>
                  <p className="text-xs text-amber-700 leading-loose italic">{trimmedLine}</p>
                </div>
               );
            }

            return <p key={idx} className="text-slate-700 leading-relaxed text-base mb-4">{trimmedLine}</p>;
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;
