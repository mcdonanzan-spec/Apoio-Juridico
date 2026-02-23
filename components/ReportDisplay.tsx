
import React from 'react';

interface ReportDisplayProps { report: string; }

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  const getScoreColor = (score: number) => {
    if (score <= 25) return 'text-emerald-600 border-emerald-500';
    if (score <= 50) return 'text-amber-500 border-amber-400';
    if (score <= 75) return 'text-orange-600 border-orange-500';
    return 'text-red-600 border-red-600';
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Ficha_Resumo_Unita.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-4xl mx-auto my-10 animate-fade-in no-print">
      <div className="flex justify-end mb-6">
        <button onClick={handleDownloadPDF} className="px-8 py-3 bg-[#f5511e] text-white rounded shadow-lg hover:bg-[#d84315] transition-all font-bold text-xs uppercase tracking-widest">
          Gerar PDF de Pré-Auditoria
        </button>
      </div>

      <div id="report-content" className="bg-white shadow-xl relative pb-20 overflow-visible" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
        
        {/* Faixa Laranja Superior */}
        <div className="h-4 bg-[#f5511e]"></div>
        
        {/* Header Unità */}
        <div className="p-12 flex justify-between items-start border-b border-slate-100">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">unit<span className="text-[#f5511e]">à</span></h1>
            <p className="text-[9px] font-black text-slate-400 tracking-[0.4em] uppercase">Engenharia</p>
          </div>
          
          <div className="text-right text-[10px] text-slate-400 font-medium leading-relaxed">
            <p>contato@unitaengenharia.com.br</p>
            <p>www.unitaengenharia.com.br</p>
            <p>Rua Peixoto Gomide, 996 - Jd. Paulista</p>
            <p className="text-slate-900 font-bold mt-2 uppercase tracking-tighter">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="px-12 py-8">
          <div className="border-b-2 border-slate-900 mb-8">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest pb-2">Ficha Resumo do Contrato de Prestação de Serviços</h2>
          </div>

          <div className="space-y-0.5">
            {report.split('\n').map((line, idx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return <div key={idx} className="h-3"></div>;

              // Ignorar títulos de primeiro nível que já estão no layout
              if (trimmedLine.startsWith('# ')) return null;

              // Subseções de Análise
              if (trimmedLine.startsWith('## ')) {
                return (
                  <div key={idx} className="bg-slate-50 border-l-4 border-slate-900 px-3 py-1.5 my-6">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{trimmedLine.replace('## ', '')}</h3>
                  </div>
                );
              }

              // Dados da Ficha Resumo (Estilo Grid)
              if (trimmedLine.startsWith('- **') && trimmedLine.includes('**: ')) {
                const [label, value] = trimmedLine.replace('- **', '').split('**: ');
                return (
                  <div key={idx} className="grid grid-cols-10 border-b border-slate-50 py-2 items-start hover:bg-slate-50/50">
                    <span className="col-span-3 text-[10px] font-black text-slate-400 uppercase pt-0.5">{label}</span>
                    <span className="col-span-7 text-[12px] text-slate-800 font-semibold leading-tight">{value}</span>
                  </div>
                );
              }

              // Índice de Exposição em Destaque
              if (trimmedLine.includes('Índice de Exposição:')) {
                const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
                return (
                  <div key={idx} className="flex justify-end my-10 pr-4">
                    <div className={`w-36 h-36 rounded-full border-[10px] flex flex-col items-center justify-center bg-white shadow-xl ${getScoreColor(score)}`}>
                      <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Exposição</span>
                      <span className="text-4xl font-black">{score}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Pontos</span>
                    </div>
                  </div>
                );
              }

              // Classificação Qualitativa
              if (trimmedLine.includes('Classificação:')) {
                const value = trimmedLine.split(': ')[1];
                return (
                  <div key={idx} className="text-right pr-4 -mt-6 mb-10">
                    <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Status de Risco:</span>
                    <span className="text-sm font-black text-slate-800 uppercase">{value}</span>
                  </div>
                );
              }

              // Sugestões e Riscos (Bullet Points)
              if (trimmedLine.startsWith('- ')) {
                return (
                  <div key={idx} className="flex gap-3 mb-2 ml-4">
                    <span className="text-[#f5511e] font-bold">•</span>
                    <p className="text-[12px] text-slate-700 leading-relaxed">{trimmedLine.replace('- ', '').replace(/\*\*/g, '')}</p>
                  </div>
                );
              }

              // Aviso Legal (Caixa Amarela Corrigida)
              if (trimmedLine.includes('AVISO LEGAL') || trimmedLine.includes('não substitui parecer')) {
                return (
                  <div key={idx} className="mt-16 p-6 bg-amber-50 border border-amber-200 rounded flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-amber-800 uppercase mb-1">Aviso de Pré-Auditoria Técnica</h4>
                      <p className="text-[11px] text-amber-900 italic leading-relaxed">{trimmedLine.replace('# AVISO LEGAL', '').trim()}</p>
                    </div>
                  </div>
                );
              }

              return <p key={idx} className="text-[12px] text-slate-600 leading-relaxed mb-2">{trimmedLine.replace(/\*\*/g, '')}</p>;
            })}
          </div>
        </div>

        {/* Rodapé Simples e Fluído (Sem absolute bottom fixo para evitar overlap) */}
        <div className="mt-20 px-12 border-t border-slate-100 pt-6">
          <div className="flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase tracking-widest">
            <span>LegalOps Brasil • IA de Engenharia</span>
            <span>Unità Engenharia • 2026</span>
          </div>
        </div>
      </div>
      
      <div className="mt-10 text-center text-slate-400 text-[10px] pb-10">
        Relatório gerado automaticamente para fins de triagem de contratos.
      </div>
    </div>
  );
};

export default ReportDisplay;
