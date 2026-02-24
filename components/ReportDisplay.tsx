
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
    
    // Configurações de Especialista para Alinhamento Perfeito em A4
    const opt = {
      margin: [10, 0, 10, 0], // 10mm de respiro vertical entre páginas
      filename: `Ficha_Unita_Digital_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: false,
        letterRendering: true,
        width: 800, // Largura de renderização fixa
        windowWidth: 800, // Força o viewport para evitar cortes responsivos
        backgroundColor: '#FFFFFF'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-5xl mx-auto my-10 animate-fade-in no-print px-4">
      <div className="flex justify-end mb-6">
        <button 
          onClick={handleDownloadPDF} 
          className="px-10 py-4 bg-[#f5511e] text-white rounded-lg shadow-2xl hover:bg-[#d84315] transition-all font-black text-[12px] uppercase tracking-[0.2em] flex items-center gap-3 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Exportar Relatório A4
        </button>
      </div>

      {/* Container de Precisão: 800px é o ideal para converter para 210mm (A4) */}
      <div 
        id="report-content" 
        className="bg-white overflow-hidden shadow-sm" 
        style={{ width: '800px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}
      >
        <div className="h-3 bg-[#f5511e] w-full"></div>
        
        {/* Header Corporativo High-End */}
        <div className="px-16 pt-10 pb-8 flex justify-between items-start border-b border-slate-100">
          <div className="shrink-0">
            <h1 className="text-[48px] font-black text-slate-800 tracking-tighter leading-none m-0">unit<span className="text-[#f5511e]">à</span></h1>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.5em] uppercase m-0 mt-1">Engenharia</p>
          </div>
          
          <div className="text-right text-[10px] text-slate-400 font-bold leading-relaxed space-y-0.5 max-w-[300px]">
            <p className="m-0 text-slate-800 font-black uppercase tracking-widest mb-2">Relatório de Conformidade Técnica</p>
            <p className="m-0 uppercase">contato@unitaengenharia.com.br</p>
            <p className="m-0 uppercase">www.unitaengenharia.com.br</p>
            <p className="m-0 uppercase">Rua Peixoto Gomide, 996 - São Paulo - SP</p>
            <p className="text-slate-900 font-black mt-3 text-[11px]">DATA: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="px-16 py-10">
          <div className="border-b-4 border-slate-900 mb-10 pb-2">
            <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-[0.15em] m-0">FICHA RESUMO DO CONTRATO</h2>
          </div>

          <div className="space-y-0">
            {report.split('\n').map((line, idx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return <div key={idx} className="h-6"></div>;

              if (trimmedLine.startsWith('# ')) return null;
              if (trimmedLine.toLowerCase().startsWith('aqui está') || 
                  trimmedLine.toLowerCase().startsWith('realizada conforme')) return null;

              // Títulos de Seção
              if (trimmedLine.startsWith('## ')) {
                return (
                  <div key={idx} className="bg-slate-900 text-white px-6 py-3 my-8" style={{ breakInside: 'avoid' }}>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] m-0">{trimmedLine.replace('## ', '')}</h3>
                  </div>
                );
              }

              // Dados Técnicos (Grid 4/8 com alinhamento vertical perfeito)
              if (trimmedLine.startsWith('- **') && trimmedLine.includes('**: ')) {
                const [label, value] = trimmedLine.replace('- **', '').split('**: ');
                return (
                  <div key={idx} className="grid grid-cols-12 border-b border-slate-100 py-4 items-baseline gap-6" style={{ breakInside: 'avoid' }}>
                    <div className="col-span-4">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{label}</span>
                    </div>
                    <div className="col-span-8">
                      <span className="text-[12px] text-slate-900 font-bold leading-relaxed block">{value}</span>
                    </div>
                  </div>
                );
              }

              // Medidor de Risco (Design Impactante)
              if (trimmedLine.includes('Índice de Exposição:')) {
                const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
                return (
                  <div key={idx} className="flex justify-end my-14 pr-10" style={{ breakInside: 'avoid' }}>
                    <div className={`w-40 h-40 rounded-full border-[10px] flex flex-col items-center justify-center bg-white shadow-2xl ${getScoreColor(score).split(' ')[0]} ${getScoreColor(score).split(' ')[1]}`}>
                      <span className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Exposição</span>
                      <span className="text-5xl font-black leading-none">{score}</span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] mt-1">Pontos</span>
                    </div>
                  </div>
                );
              }

              if (trimmedLine.includes('Classificação:')) {
                const val = trimmedLine.split(': ')[1].replace(/\*/g, '');
                return (
                  <div key={idx} className="text-right pr-14 -mt-12 mb-10" style={{ breakInside: 'avoid' }}>
                    <span className="text-[10px] font-black uppercase text-slate-300 mr-3">Classificação de Risco:</span>
                    <span className="text-[16px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-1">{val}</span>
                  </div>
                );
              }

              // Itens de Lista
              if (trimmedLine.startsWith('- ')) {
                return (
                  <div key={idx} className="flex gap-4 mb-4 ml-2 pr-10 items-start" style={{ breakInside: 'avoid' }}>
                    <div className="w-2 h-2 bg-[#f5511e] rounded-full mt-2 shrink-0"></div>
                    <p className="text-[12px] text-slate-700 leading-relaxed font-semibold m-0">{trimmedLine.replace('- ', '').replace(/\*\*/g, '')}</p>
                  </div>
                );
              }

              // Aviso Legal Corporate Style
              if (trimmedLine.includes('AVISO LEGAL') || trimmedLine.includes('não substitui parecer')) {
                return (
                  <div key={idx} className="mt-20 p-8 bg-amber-50 border-2 border-amber-100 rounded-xl flex items-center gap-8 mr-6" style={{ breakInside: 'avoid' }}>
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-amber-800 uppercase mb-1 tracking-[0.2em] m-0">Aviso Legal e Limitação de Responsabilidade</h4>
                      <p className="text-[11px] text-amber-900 italic leading-relaxed font-medium m-0">{trimmedLine.replace('# AVISO LEGAL', '').trim()}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="break-inside-avoid">
                  <p className="text-[12px] text-slate-600 leading-relaxed mb-5 pr-10">{trimmedLine.replace(/\*\*/g, '')}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé Corporativo Padrão Unità */}
        <div className="mt-auto px-16 pt-10 pb-12">
          <div className="border-t-2 border-slate-100 pt-8 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.5em]">
            <div className="flex items-center gap-4">
              <span className="w-2 h-2 bg-[#f5511e] rounded-full"></span>
              <span>LegalOps Brasil • IA Solutions</span>
            </div>
            <span>Documento Reservado • Unità Engenharia</span>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center text-slate-400 text-[11px] font-medium no-print pb-20 italic">
        Nota: O layout acima é processado para exportação em alta definição (300 DPI equivalente).
      </div>
    </div>
  );
};

export default ReportDisplay;
