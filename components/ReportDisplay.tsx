
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
    
    // Configurações para evitar cortes laterais: 
    // Largura do elemento é 210mm, margem PDF é 0 para encaixe perfeito.
    const opt = {
      margin: 0,
      filename: `Ficha_Resumo_Unita_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        width: 794, // Equivalente a 210mm em 96dpi
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-4xl mx-auto my-10 animate-fade-in no-print">
      <div className="flex justify-end mb-6">
        <button 
          onClick={handleDownloadPDF} 
          className="px-8 py-3 bg-[#f5511e] text-white rounded shadow-lg hover:bg-[#d84315] transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Gerar PDF de Pré-Auditoria
        </button>
      </div>

      {/* Container do Relatório - Largura Fixa A4 (210mm) */}
      <div 
        id="report-content" 
        className="bg-white shadow-xl relative overflow-visible box-border" 
        style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', paddingBottom: '40px' }}
      >
        
        {/* Faixa Laranja Superior */}
        <div className="h-4 bg-[#f5511e] w-full"></div>
        
        {/* Header Unità */}
        <div className="px-12 py-10 flex justify-between items-start border-b border-slate-100">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">unit<span className="text-[#f5511e]">à</span></h1>
            <p className="text-[9px] font-black text-slate-400 tracking-[0.4em] uppercase">Engenharia</p>
          </div>
          
          <div className="text-right text-[10px] text-slate-400 font-medium leading-tight">
            <p>contato@unitaengenharia.com.br</p>
            <p>www.unitaengenharia.com.br</p>
            <p>Rua Peixoto Gomide, 996 - Jd. Paulista</p>
            <p className="text-slate-900 font-bold mt-2 uppercase tracking-tighter">EMISSÃO: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="px-12 py-8">
          <div className="border-b-2 border-slate-900 mb-8">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest pb-2">Ficha Resumo do Contrato de Prestação de Serviços</h2>
          </div>

          <div className="space-y-1">
            {report.split('\n').map((line, idx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return <div key={idx} className="h-4"></div>;

              if (trimmedLine.startsWith('# ')) return null;

              // Subseções de Análise
              if (trimmedLine.startsWith('## ')) {
                return (
                  <div key={idx} className="bg-slate-50 border-l-4 border-slate-900 px-4 py-2 my-6">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{trimmedLine.replace('## ', '')}</h3>
                  </div>
                );
              }

              // Dados da Ficha Resumo (Estilo Grid)
              if (trimmedLine.startsWith('- **') && trimmedLine.includes('**: ')) {
                const [label, value] = trimmedLine.replace('- **', '').split('**: ');
                return (
                  <div key={idx} className="grid grid-cols-12 border-b border-slate-50 py-2.5 items-start hover:bg-slate-50/50">
                    <span className="col-span-4 text-[10px] font-black text-slate-400 uppercase pt-0.5 pr-4">{label}</span>
                    <span className="col-span-8 text-[12px] text-slate-800 font-semibold leading-relaxed">{value}</span>
                  </div>
                );
              }

              // Índice de Exposição em Destaque
              if (trimmedLine.includes('Índice de Exposição:')) {
                const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
                return (
                  <div key={idx} className="flex justify-end my-8 pr-4">
                    <div className={`w-32 h-32 rounded-full border-[8px] flex flex-col items-center justify-center bg-white shadow-lg ${getScoreColor(score)}`}>
                      <span className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Exposição</span>
                      <span className="text-4xl font-black leading-none">{score}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest mt-1">Pontos</span>
                    </div>
                  </div>
                );
              }

              // Classificação Qualitativa
              if (trimmedLine.includes('Classificação:')) {
                const value = trimmedLine.split(': ')[1].replace(/\*/g, '');
                return (
                  <div key={idx} className="text-right pr-4 -mt-4 mb-8">
                    <span className="text-[9px] font-black uppercase text-slate-400 mr-2">Status de Risco:</span>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{value}</span>
                  </div>
                );
              }

              // Sugestões e Riscos (Bullet Points)
              if (trimmedLine.startsWith('- ')) {
                return (
                  <div key={idx} className="flex gap-3 mb-3 ml-2 pr-4">
                    <span className="text-[#f5511e] font-bold mt-0.5">•</span>
                    <p className="text-[12px] text-slate-700 leading-relaxed">{trimmedLine.replace('- ', '').replace(/\*\*/g, '')}</p>
                  </div>
                );
              }

              // Aviso Legal (Caixa Amarela Fluída)
              if (trimmedLine.includes('AVISO LEGAL') || trimmedLine.includes('não substitui parecer')) {
                return (
                  <div key={idx} className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-4 mx-2">
                    <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-black text-amber-800 uppercase mb-1">Aviso de Pré-Auditoria Técnica</h4>
                      <p className="text-[11px] text-amber-900 italic leading-relaxed">{trimmedLine.replace('# AVISO LEGAL', '').trim()}</p>
                    </div>
                  </div>
                );
              }

              return <p key={idx} className="text-[12px] text-slate-600 leading-relaxed mb-3 pr-4">{trimmedLine.replace(/\*\*/g, '')}</p>;
            })}
          </div>
        </div>

        {/* Rodapé Fluído (Sempre ao final do conteúdo) */}
        <div className="mt-auto px-12 pt-12 pb-8">
          <div className="flex justify-between items-center text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] border-t border-slate-50 pt-4">
            <span>LegalOps Brasil • IA de Engenharia</span>
            <span className="text-slate-200">Unità Engenharia • Corporate Report</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-slate-400 text-[10px] pb-10">
        Relatório Técnico Gerado via Processamento de Linguagem Natural (LLM).
      </div>
    </div>
  );
};

export default ReportDisplay;
