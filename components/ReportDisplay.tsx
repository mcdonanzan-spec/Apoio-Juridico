
import React from 'react';

interface ReportDisplayProps { report: string; }

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  const getScoreColor = (score: number) => {
    if (score <= 25) return 'bg-emerald-500';
    if (score <= 50) return 'bg-amber-500';
    if (score <= 75) return 'bg-orange-500';
    return 'bg-rose-600';
  };

  const getScoreTextClass = (score: number) => {
    if (score <= 25) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score <= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    if (score <= 75) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    const opt = {
      margin: [10, 10],
      filename: `Ficha_Resumo_Auditoria.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-4xl mx-auto my-10 animate-fade-in">
      <div className="flex justify-end mb-6 no-print">
        <button onClick={handleDownloadPDF} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-black transition-all flex items-center gap-2 shadow-lg font-bold text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Gerar PDF Executivo
        </button>
      </div>

      <div id="report-content" className="bg-white p-12 md:p-16 rounded-sm shadow-sm border border-slate-200 min-h-[297mm]">
        {/* Header Estilo Corporate */}
        <div className="flex justify-between items-start border-b border-slate-300 pb-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LegalOps Brasil</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Auditoria Jurídica de Engenharia</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Data da Emissão</p>
            <p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none prose-sm">
          {report.split('\n').map((line, idx) => {
            const trimmedLine = line.trim();
            if (!trimmedLine && line !== '') return <div key={idx} className="h-2"></div>;

            // Seções Principais
            if (trimmedLine.startsWith('# ')) {
              return (
                <div key={idx} className="bg-slate-900 text-white px-4 py-2 my-8 rounded-sm">
                  <h2 className="text-sm font-black uppercase tracking-widest m-0">{trimmedLine.replace('# ', '')}</h2>
                </div>
              );
            }

            // Subseções
            if (trimmedLine.startsWith('## ')) {
              return (
                <h3 key={idx} className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 mt-10 mb-4">
                  {trimmedLine.replace('## ', '')}
                </h3>
              );
            }

            // Dashboard de Barras (Mais Sóbrio)
            if (trimmedLine.startsWith('- [') && trimmedLine.includes(']:')) {
              const match = trimmedLine.match(/\[(.*?)\]: (\d+)/);
              if (match) {
                const category = match[1];
                const score = parseInt(match[2]);
                return (
                  <div key={idx} className="mb-3 grid grid-cols-4 items-center gap-4">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{category}</span>
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${getScoreColor(score)}`} style={{ width: `${score}%` }}></div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-700 w-8">{score}%</span>
                    </div>
                  </div>
                );
              }
            }

            // Ficha Resumo (Estilo Tabela/Lista Limpa)
            if (trimmedLine.includes(': ') && (trimmedLine.match(/^[0-9]\./) || trimmedLine.startsWith('- '))) {
              const [label, ...valueParts] = trimmedLine.split(': ');
              const value = valueParts.join(': ');
              return (
                <div key={idx} className="flex flex-col md:flex-row gap-2 py-3 border-b border-slate-50">
                  <span className="w-full md:w-1/3 text-[10px] font-black text-slate-400 uppercase leading-snug">
                    {label.replace(/^[0-9]\.\s*/, '').replace('- ', '').replace('**', '').replace('**', '')}
                  </span>
                  <span className="flex-1 text-[13px] text-slate-800 font-medium leading-relaxed">
                    {value.replace(/\*\*/g, '')}
                  </span>
                </div>
              );
            }

            // Score Consolidado
            if (trimmedLine.includes('Score Final Consolidado:')) {
              const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
              return (
                <div key={idx} className="my-10 p-8 border-2 border-slate-900 rounded-sm flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-xs font-black uppercase text-slate-500 mb-1">Índice Geral de Risco</h4>
                    <p className="text-[11px] text-slate-400 italic">Cálculo ponderado baseado na Matriz Unità (Financeiro, Trabalhista, Estrutural).</p>
                  </div>
                  <div className={`w-24 h-24 flex flex-col items-center justify-center border-4 rounded-full ${getScoreTextClass(score)}`}>
                    <span className="text-3xl font-black">{score}</span>
                    <span className="text-[8px] font-bold uppercase">Pontos</span>
                  </div>
                </div>
              );
            }

            // Footer / Disclaimer
            if (trimmedLine.startsWith('DECLARAÇÃO FINAL') || trimmedLine.includes('Não substitui parecer')) {
              return (
                <div key={idx} className="mt-12 pt-6 border-t border-slate-200">
                  <p className="text-[10px] text-slate-400 italic leading-relaxed">{trimmedLine}</p>
                </div>
              );
            }

            return <p key={idx} className="text-slate-600 text-[13px] leading-relaxed mb-3">{trimmedLine.replace(/\*\*/g, '')}</p>;
          })}
        </div>
        
        <div className="mt-16 pt-8 text-center border-t border-slate-100">
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">Documento Gerado por Inteligência Artificial - LegalOps Brasil</p>
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;
