
import React from 'react';

interface ReportDisplayProps { report: string; }

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  const getScoreColor = (score: number) => {
    if (score <= 30) return 'text-emerald-700 border-emerald-500 bg-emerald-50';
    if (score <= 60) return 'text-amber-600 border-amber-400 bg-amber-50';
    if (score <= 85) return 'text-orange-700 border-orange-500 bg-orange-50';
    return 'text-red-700 border-red-600 bg-red-50';
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const opt = {
      margin: [10, 0, 10, 0], // Margens verticais para respiro entre páginas
      filename: `Ficha_Resumo_Unita_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        width: 794, 
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-5xl mx-auto my-10 animate-fade-in no-print">
      <div className="flex justify-end mb-6">
        <button 
          onClick={handleDownloadPDF} 
          className="px-8 py-3 bg-[#f5511e] text-white rounded shadow-xl hover:bg-[#d84315] transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          Exportar Relatório Final
        </button>
      </div>

      <div 
        id="report-content" 
        className="bg-white relative overflow-visible box-border" 
        style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}
      >
        {/* Faixa Superior Compacta */}
        <div className="h-2 bg-[#f5511e] w-full"></div>
        
        {/* Header Corporativo Otimizado */}
        <div className="px-12 pt-8 pb-4 flex justify-between items-end border-b border-slate-100">
          <div>
            <h1 className="text-[36px] font-black text-slate-800 tracking-tighter leading-none m-0">unit<span className="text-[#f5511e]">à</span></h1>
            <p className="text-[9px] font-black text-slate-400 tracking-[0.4em] uppercase m-0">Engenharia</p>
          </div>
          
          <div className="text-right text-[9px] text-slate-400 font-bold leading-tight uppercase">
            <p className="m-0">contato@unitaengenharia.com.br • www.unitaengenharia.com.br</p>
            <p className="m-0">Rua Peixoto Gomide, 996 - Jd. Paulista - São Paulo</p>
            <p className="m-0 text-slate-800 mt-1">EMISSÃO: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="px-12 py-6">
          <div className="border-b border-slate-900 mb-6 pb-2">
            <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest m-0">FICHA RESUMO DO CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
          </div>

          <div className="space-y-0 text-slate-800">
            {report.split('\n').map((line, idx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return null;

              if (trimmedLine.startsWith('# ')) return null;
              if (trimmedLine.toLowerCase().startsWith('aqui está') || 
                  trimmedLine.toLowerCase().startsWith('realizada conforme') ||
                  trimmedLine.toLowerCase().startsWith('segue a análise')) {
                return null;
              }

              // Seções com Background Sutil
              if (trimmedLine.startsWith('## ')) {
                return (
                  <div key={idx} className="bg-slate-50 border-l-[3px] border-slate-800 px-4 py-2 my-4 break-inside-avoid">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest m-0">{trimmedLine.replace('## ', '')}</h3>
                  </div>
                );
              }

              // Grid de Dados 3/9 para mais espaço ao valor
              if (trimmedLine.startsWith('- **') && trimmedLine.includes('**: ')) {
                const [label, value] = trimmedLine.replace('- **', '').split('**: ');
                return (
                  <div key={idx} className="grid grid-cols-12 border-b border-slate-50 py-2.5 items-start gap-4 break-inside-avoid">
                    <div className="col-span-3">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight pt-1 block leading-none">{label}</span>
                    </div>
                    <div className="col-span-9">
                      <span className="text-[11px] text-slate-900 font-bold leading-snug block">{value}</span>
                    </div>
                  </div>
                );
              }

              // Badge de Score Compacta
              if (trimmedLine.includes('Índice de Exposição:')) {
                const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
                return (
                  <div key={idx} className="flex justify-end my-8 pr-4 break-inside-avoid">
                    <div className={`w-28 h-28 rounded-full border-[6px] flex flex-col items-center justify-center bg-white shadow-lg ${getScoreColor(score).split(' ')[0]} ${getScoreColor(score).split(' ')[1]}`}>
                      <span className="text-[8px] font-black uppercase text-slate-400 mb-0.5 tracking-tighter">Grau de Risco</span>
                      <span className="text-3xl font-black leading-none">{score}</span>
                      <span className="text-[7px] font-bold uppercase tracking-[0.2em] mt-0.5">Pontos</span>
                    </div>
                  </div>
                );
              }

              if (trimmedLine.includes('Classificação:')) {
                const val = trimmedLine.split(': ')[1].replace(/\*/g, '');
                return (
                  <div key={idx} className="text-right pr-6 -mt-6 mb-8 break-inside-avoid">
                    <span className="text-[9px] font-black uppercase text-slate-300 mr-2">Status da Análise:</span>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest border-b border-slate-800 pb-0.5">{val}</span>
                  </div>
                );
              }

              // Itens de Lista com Marcador Unità
              if (trimmedLine.startsWith('- ')) {
                return (
                  <div key={idx} className="flex gap-3 mb-2 ml-1 pr-4 items-start break-inside-avoid">
                    <div className="w-1 h-1 bg-[#f5511e] rounded-full mt-1.5 shrink-0"></div>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-semibold m-0">{trimmedLine.replace('- ', '').replace(/\*\*/g, '')}</p>
                  </div>
                );
              }

              // Aviso Legal Clean no Fim
              if (trimmedLine.includes('AVISO LEGAL') || trimmedLine.includes('não substitui parecer')) {
                return (
                  <div key={idx} className="mt-10 p-5 bg-amber-50 border border-amber-100 rounded flex items-start gap-4 mr-2 break-inside-avoid">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black text-amber-800 uppercase mb-0.5 tracking-wider m-0">Aviso de Auditoria Técnica</h4>
                      <p className="text-[10px] text-amber-900 italic leading-relaxed font-medium m-0">{trimmedLine.replace('# AVISO LEGAL', '').trim()}</p>
                    </div>
                  </div>
                );
              }

              return <p key={idx} className="text-[11px] text-slate-600 leading-relaxed mb-3 pr-4">{trimmedLine.replace(/\*\*/g, '')}</p>;
            })}
          </div>
        </div>

        {/* Rodapé Dinâmico */}
        <div className="mt-8 px-12 pb-10">
          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[7px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            <span>LegalOps Brasil • IA de Engenharia</span>
            <span className="text-slate-200">Unità Engenharia • Relatório de Compliance</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-slate-400 text-[10px] font-medium no-print pb-20">
        Este documento foi processado via IA seguindo os protocolos de análise de risco da Unità.
      </div>
    </div>
  );
};

export default ReportDisplay;
