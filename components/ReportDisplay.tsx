
import React from 'react';

interface ReportDisplayProps { report: string; }

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  const getScoreColor = (score: number) => {
    if (score <= 25) return 'bg-green-500';
    if (score <= 50) return 'bg-yellow-500';
    if (score <= 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score <= 25) return 'bg-green-50 border-green-200 text-green-700';
    if (score <= 50) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    if (score <= 75) return 'bg-orange-50 border-orange-200 text-orange-700';
    return 'bg-red-50 border-red-200 text-red-700';
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Relatorio_Tecnico_LegalOps_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-5xl mx-auto my-10 animate-fade-in">
      <div className="flex justify-end mb-6 no-print">
        <button onClick={handleDownloadPDF} className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-xl font-bold text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Baixar Relatório de Auditoria (PDF)
        </button>
      </div>

      <div id="report-content" className="bg-white p-8 md:p-16 rounded-3xl shadow-2xl border border-slate-100">
        {/* Header Profissional */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b-4 border-slate-900 pb-8 mb-12">
          <div>
            <h1 className="text-5xl font-serif text-slate-900 mb-2">LegalOps Brasil</h1>
            <p className="text-xs font-black tracking-[0.3em] text-blue-600 uppercase">Inteligência Jurídica Especializada</p>
          </div>
          <div className="mt-6 md:mt-0 text-right">
            <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 inline-block">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status da Auditoria</p>
              <p className="text-xs font-mono font-bold text-slate-700">CONCLUÍDO EM {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          {report.split('\n').map((line, idx) => {
            const trimmedLine = line.trim();
            if (!trimmedLine && line !== '') return <div key={idx} className="h-4"></div>;

            // Títulos
            if (trimmedLine.startsWith('# ')) {
              return <h2 key={idx} className="text-3xl font-black text-slate-900 mt-16 mb-8 border-b-2 border-slate-100 pb-4 uppercase">{trimmedLine.replace('# ', '')}</h2>;
            }

            // Headers de Seção
            if (trimmedLine.startsWith('## ')) {
              const headerText = trimmedLine.replace('## ', '');
              return (
                <div key={idx} className="mt-12 mb-6">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <span className="w-2 h-8 bg-slate-900 rounded-full"></span>
                    {headerText}
                  </h3>
                </div>
              );
            }

            // Renderização do Dashboard de Riscos Ponderados
            if (trimmedLine.startsWith('- [') && trimmedLine.includes(']:')) {
              const match = trimmedLine.match(/\[(.*?)\]: (\d+)/);
              if (match) {
                const category = match[1];
                const score = parseInt(match[2]);
                return (
                  <div key={idx} className="mb-4">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">
                      <span>{category}</span>
                      <span>{score}/100</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                      <div 
                        className={`h-full transition-all duration-1000 ${getScoreColor(score)}`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                );
              }
            }

            // Ficha Resumo
            if (trimmedLine.includes(': ') && (trimmedLine.match(/^[0-9]\./) || trimmedLine.startsWith('- '))) {
              const [label, ...valueParts] = trimmedLine.split(': ');
              const value = valueParts.join(': ');
              return (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-b border-slate-50 hover:bg-slate-50/50 px-2 group">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{label.replace(/^[0-9]\.\s*/, '').replace('- ', '')}</span>
                  <span className="text-sm text-slate-800 md:col-span-3 font-semibold leading-relaxed">{value}</span>
                </div>
              );
            }

            // Score Final Gigante
            if (trimmedLine.includes('Score Final Consolidado:')) {
              const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
              return (
                <div key={idx} className="my-12 p-10 bg-slate-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className={`w-40 h-40 rounded-3xl flex flex-col items-center justify-center border-4 shadow-2xl ${getScoreBg(score)}`}>
                      <span className="text-6xl font-black">{score}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Score Real</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold mb-2">Matriz de Risco Realista</h4>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        Este valor é resultado da média ponderada de 5 pilares críticos. Números entre <strong>0 e 25</strong> indicam conformidade ideal. Scores acima de <strong>50</strong> exigem renegociação imediata de cláusulas financeiras e trabalhistas.
                      </p>
                      <div className="flex gap-2">
                        {['Baixo', 'Médio', 'Alto', 'Crítico'].map((cat, i) => (
                           <span key={cat} className={`text-[9px] px-3 py-1 rounded-full border font-bold uppercase tracking-tighter ${
                             (i === 0 && score <= 25) || (i === 1 && score > 25 && score <= 50) || (i === 2 && score > 50 && score <= 75) || (i === 3 && score > 75)
                             ? 'bg-white text-slate-900 border-white' : 'border-white/20 text-white/40'
                           }`}>
                             {cat}
                           </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Estilização das Sugestões de Redação (Citações)
            if (trimmedLine.startsWith('>')) {
              return (
                <div key={idx} className="my-6 p-6 bg-blue-50 border-l-4 border-blue-600 rounded-r-xl italic text-slate-700 text-sm shadow-sm font-medium">
                  {trimmedLine.replace('>', '').trim()}
                </div>
              );
            }

            // Aviso Legal
            if (trimmedLine.startsWith('DECLARAÇÃO FINAL') || trimmedLine.includes('não substitui parecer jurídico formal')) {
              return (
                <div key={idx} className="mt-20 p-8 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-6">
                  <div className="bg-amber-100 p-3 rounded-2xl text-amber-700">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <p className="text-xs text-amber-900 leading-loose font-medium italic">{trimmedLine}</p>
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
