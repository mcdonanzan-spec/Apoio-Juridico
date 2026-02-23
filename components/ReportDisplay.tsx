
import React from 'react';

interface ReportDisplayProps { report: string; }

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  const getScoreColor = (score: number) => {
    if (score <= 30) return 'text-emerald-600 border-emerald-500 bg-emerald-50';
    if (score <= 60) return 'text-amber-500 border-amber-400 bg-amber-50';
    if (score <= 85) return 'text-orange-600 border-orange-500 bg-orange-50';
    return 'text-red-600 border-red-600 bg-red-50';
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const opt = {
      margin: 0,
      filename: `Ficha_Resumo_Unita_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        width: 794, 
        windowWidth: 794,
        x: 0,
        y: 0
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
          className="px-10 py-4 bg-[#f5511e] text-white rounded shadow-xl hover:bg-[#d84315] transition-all font-black text-xs uppercase tracking-widest flex items-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          Exportar PDF Profissional
        </button>
      </div>

      <div 
        id="report-content" 
        className="bg-white relative overflow-hidden box-border" 
        style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}
      >
        <div className="h-4 bg-[#f5511e] w-full"></div>
        
        <div className="px-12 pt-10 pb-6 flex justify-between items-start border-b border-slate-50">
          <div>
            <h1 className="text-[42px] font-black text-slate-800 tracking-tighter leading-none m-0">unit<span className="text-[#f5511e]">à</span></h1>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.5em] uppercase m-0 mt-1">Engenharia</p>
          </div>
          
          <div className="text-right text-[10px] text-slate-400 font-bold leading-relaxed space-y-0.5">
            <p className="m-0">contato@unitaengenharia.com.br</p>
            <p className="m-0">www.unitaengenharia.com.br</p>
            <p className="m-0">Rua Peixoto Gomide, 996 - Jd. Paulista</p>
            <p className="m-0 text-slate-800 uppercase tracking-tighter mt-2">EMISSÃO: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="px-12 py-8">
          <div className="border-b-2 border-slate-900 mb-8 pb-1">
            <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-widest m-0">FICHA RESUMO DO CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
          </div>

          <div className="space-y-0 text-slate-800">
            {report.split('\n').map((line, idx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return <div key={idx} className="h-3"></div>;

              // Ignora títulos de primeiro nível (já incluídos no layout fixo) 
              // e textos introdutórios conversacionais
              if (trimmedLine.startsWith('# ')) return null;
              if (trimmedLine.toLowerCase().startsWith('aqui está') || 
                  trimmedLine.toLowerCase().startsWith('realizada conforme') ||
                  trimmedLine.toLowerCase().startsWith('segue a análise')) {
                return null;
              }

              if (trimmedLine.startsWith('## ')) {
                return (
                  <div key={idx} className="bg-slate-100 border-l-4 border-slate-900 px-4 py-2 my-6 page-break-avoid">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] m-0">{trimmedLine.replace('## ', '')}</h3>
                  </div>
                );
              }

              if (trimmedLine.startsWith('- **') && trimmedLine.includes('**: ')) {
                const [label, value] = trimmedLine.replace('- **', '').split('**: ');
                return (
                  <div key={idx} className="grid grid-cols-12 border-b border-slate-50 py-3 items-start gap-4 page-break-avoid">
                    <div className="col-span-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter pt-1 block">{label}</span>
                    </div>
                    <div className="col-span-8">
                      <span className="text-[12px] text-slate-900 font-bold leading-[1.4] block">{value}</span>
                    </div>
                  </div>
                );
              }

              if (trimmedLine.includes('Índice de Exposição:')) {
                const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
                return (
                  <div key={idx} className="flex justify-end my-12 pr-4 page-break-avoid">
                    <div className={`w-36 h-36 rounded-full border-[8px] flex flex-col items-center justify-center bg-white shadow-2xl ${getScoreColor(score).split(' ')[0]} ${getScoreColor(score).split(' ')[1]}`}>
                      <span className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-tighter">Grau de Risco</span>
                      <span className="text-5xl font-black leading-none">{score}</span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] mt-1">Pontos</span>
                    </div>
                  </div>
                );
              }

              if (trimmedLine.includes('Classificação:')) {
                const val = trimmedLine.split(': ')[1].replace(/\*/g, '');
                return (
                  <div key={idx} className="text-right pr-6 -mt-8 mb-10 page-break-avoid">
                    <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Status da Análise:</span>
                    <span className="text-[14px] font-black text-slate-900 uppercase tracking-widest">{val}</span>
                  </div>
                );
              }

              if (trimmedLine.startsWith('- ')) {
                return (
                  <div key={idx} className="flex gap-4 mb-3 ml-2 pr-4 items-start page-break-avoid">
                    <div className="w-1.5 h-1.5 bg-[#f5511e] rounded-full mt-1.5 shrink-0"></div>
                    <p className="text-[12px] text-slate-700 leading-relaxed font-semibold m-0">{trimmedLine.replace('- ', '').replace(/\*\*/g, '')}</p>
                  </div>
                );
              }

              if (trimmedLine.includes('AVISO LEGAL') || trimmedLine.includes('não substitui parecer')) {
                return (
                  <div key={idx} className="mt-16 p-6 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-4 mr-2 page-break-avoid">
                    <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-amber-800 uppercase mb-1 tracking-wider m-0">Aviso Legal de Pré-Auditoria</h4>
                      <p className="text-[11px] text-amber-900 italic leading-relaxed font-medium m-0">{trimmedLine.replace('# AVISO LEGAL', '').trim()}</p>
                    </div>
                  </div>
                );
              }

              return <p key={idx} className="text-[12px] text-slate-600 leading-relaxed mb-4 pr-4">{trimmedLine.replace(/\*\*/g, '')}</p>;
            })}
          </div>
        </div>

        <div className="mt-12 px-12 pb-10">
          <div className="border-t border-slate-100 pt-6 flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            <span>LegalOps Brasil • IA para Construção Civil</span>
            <span className="text-slate-200">Relatório Corporativo • Unità Engenharia</span>
          </div>
        </div>
      </div>
      
      <div className="mt-10 text-center text-slate-400 text-[11px] font-medium no-print">
        Documento gerado eletronicamente seguindo os critérios de compliance da Unità.
      </div>
    </div>
  );
};

export default ReportDisplay;
