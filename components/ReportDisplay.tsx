
import React from 'react';

interface ReportDisplayProps { report: string; }

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  const getScoreColor = (score: number) => {
    if (score <= 25) return 'text-emerald-600 border-emerald-200 bg-emerald-50';
    if (score <= 50) return 'text-amber-600 border-amber-200 bg-amber-50';
    if (score <= 75) return 'text-orange-600 border-orange-200 bg-orange-50';
    return 'text-red-600 border-red-200 bg-red-50';
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    const opt = {
      margin: [0, 0, 0, 0],
      filename: `Ficha_Resumo_Unita_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-5xl mx-auto my-10 animate-fade-in no-print">
      <div className="flex justify-end gap-3 mb-6">
        <button onClick={handleDownloadPDF} className="px-6 py-2 bg-orange-600 text-white rounded shadow hover:bg-orange-700 transition-all font-bold text-xs uppercase tracking-widest">
          Exportar Relatório (PDF)
        </button>
      </div>

      <div id="report-content" className="bg-white shadow-2xl relative overflow-hidden" style={{ minHeight: '297mm', width: '210mm', margin: '0 auto' }}>
        
        {/* Faixa Superior Estilo Unità */}
        <div className="h-4 bg-[#f5511e]"></div>
        
        {/* Header com Logo e Contatos */}
        <div className="p-10 flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-[40px] font-black text-slate-800 leading-none tracking-tighter">unit<span className="text-[#f5511e]">à</span></h1>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] mt-1 ml-1 uppercase">Engenharia</p>
          </div>
          
          <div className="text-right text-[10px] text-slate-500 space-y-1">
            <p className="flex items-center justify-end gap-2">contato@unitaengenharia.com.br <svg className="w-3 h-3 text-[#f5511e]" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></p>
            <p className="flex items-center justify-end gap-2">www.unitaengenharia.com.br <svg className="w-3 h-3 text-[#f5511e]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.34.16-2h4.68c.09.66.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg></p>
            <p>Rua Peixoto Gomide, 996 - Jd. Paulista | São Paulo</p>
          </div>
        </div>

        <div className="px-10 py-4">
          <div className="border-b-2 border-slate-900 pb-2 mb-8">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Ficha Resumo do Contrato de Prestação de Serviços</h2>
          </div>

          <div className="space-y-1">
            {report.split('\n').map((line, idx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return <div key={idx} className="h-2"></div>;

              // Títulos de Seção Principal
              if (trimmedLine.startsWith('# ')) {
                return null; // Oculta o título H1 pois já temos o header customizado
              }

              // Subseções (ex: Dashboard, Ficha Resumo)
              if (trimmedLine.startsWith('## ')) {
                const headerText = trimmedLine.replace('## ', '');
                return (
                  <div key={idx} className="bg-slate-50 border-l-4 border-slate-900 p-2 my-6">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{headerText}</h3>
                  </div>
                );
              }

              // Campo da Ficha Resumo (Estilo Grid Unità)
              if (trimmedLine.startsWith('- **') && trimmedLine.includes('**: ')) {
                const [label, value] = trimmedLine.replace('- **', '').split('**: ');
                return (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-10 gap-2 border-b border-slate-100 py-1.5 hover:bg-slate-50/50">
                    <span className="md:col-span-3 text-[10px] font-black text-slate-500 uppercase leading-none self-center">{label}</span>
                    <span className="md:col-span-7 text-[12px] text-slate-800 font-medium">{value}</span>
                  </div>
                );
              }

              // Dashboards de Risco com Barra (Versão Técnica)
              if (trimmedLine.startsWith('- [') && trimmedLine.includes(']:')) {
                const match = trimmedLine.match(/\[(.*?)\]: (\d+)/);
                if (match) {
                  const category = match[1];
                  const score = parseInt(match[2]);
                  return (
                    <div key={idx} className="mb-2 grid grid-cols-10 items-center gap-4">
                      <span className="col-span-2 text-[9px] font-bold text-slate-500 uppercase">{category}</span>
                      <div className="col-span-7 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-slate-400`} style={{ width: `${score}%` }}></div>
                      </div>
                      <span className="col-span-1 text-[9px] font-mono font-bold text-slate-400">{score}%</span>
                    </div>
                  );
                }
              }

              // Badge de Score Final (O Círculo da Unità)
              if (trimmedLine.includes('Score Final Consolidado:')) {
                const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
                return (
                  <div key={idx} className="flex justify-end my-10 relative">
                    <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center shadow-lg ${getScoreColor(score)}`}>
                      <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-none mb-1">Índice de<br/>Exposição</span>
                      <span className="text-3xl font-black">{score}</span>
                      <span className="text-[8px] font-bold uppercase">Pontos</span>
                    </div>
                  </div>
                );
              }

              // Aviso Legal (Caixa Amarela do Modelo)
              if (trimmedLine.startsWith('# AVISO LEGAL') || trimmedLine.includes('não substitui parecer')) {
                return (
                  <div key={idx} className="mt-20 p-6 bg-amber-50 border border-amber-200 rounded flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-amber-800 uppercase mb-1">Aviso Legal</h4>
                      <p className="text-[11px] text-amber-900 leading-relaxed italic">{trimmedLine.replace('# AVISO LEGAL', '').trim()}</p>
                    </div>
                  </div>
                );
              }

              return <p key={idx} className="text-[12px] text-slate-700 leading-relaxed mb-1.5">{trimmedLine.replace(/\*\*/g, '')}</p>;
            })}
          </div>
        </div>

        {/* Rodapé do Papel Timbrado */}
        <div className="absolute bottom-10 left-0 right-0 px-10">
          <div className="flex justify-between items-end border-t border-slate-100 pt-4">
            <div className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.2em]">
              LegalOps Brasil • Auditoria de Engenharia
            </div>
            <div className="text-[8px] text-slate-400">
              Página 1 de 1
            </div>
          </div>
        </div>
      </div>
      
      {/* Rodapé Externo (não sai no PDF) */}
      <div className="mt-10 text-center text-slate-400 text-xs py-10 border-t border-slate-200">
        Este documento foi gerado via Processamento de Linguagem Natural (LLM) seguindo a Matriz de Risco Unità.
      </div>
    </div>
  );
};

export default ReportDisplay;
