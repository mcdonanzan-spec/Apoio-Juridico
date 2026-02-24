
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
      margin: [10, 0, 10, 0], // Margens verticais sutis entre páginas
      filename: `Auditoria_Unita_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3, 
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: '#FFFFFF'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] } // Modo híbrido para respeitar as classes CSS de quebra
    };
    
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  const lines = report.split('\n');

  return (
    <div className="max-w-5xl mx-auto my-10 animate-fade-in no-print px-4">
      <div className="flex justify-end mb-8">
        <button 
          onClick={handleDownloadPDF} 
          className="px-10 py-4 bg-[#f5511e] text-white rounded-lg shadow-2xl hover:bg-[#d84315] transition-all font-black text-[12px] uppercase tracking-[0.2em] flex items-center gap-3 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Exportar Relatório Executivo
        </button>
      </div>

      <div 
        id="report-content" 
        className="bg-white box-border relative" 
        style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}
      >
        {/* Faixa decorativa superior em todas as páginas */}
        <div className="h-2.5 bg-[#f5511e] w-full sticky top-0"></div>
        
        {/* Cabeçalho Compacto para Ganhar Espaço */}
        <div className="px-[20mm] pt-[12mm] pb-[6mm] flex justify-between items-start border-b-2 border-slate-50">
          <div>
            <h1 className="text-[38px] font-black text-slate-800 tracking-tighter leading-none m-0">unit<span className="text-[#f5511e]">à</span></h1>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase m-0 leading-none mt-1">Engenharia</p>
          </div>
          
          <div className="text-right text-[8.5px] text-slate-400 font-bold leading-tight uppercase">
            <p className="m-0 tracking-widest text-slate-800 font-black mb-1">Auditoria Técnica de Contratos</p>
            <p className="m-0 italic">Página Oficial de Auditoria</p>
            <p className="m-0 text-slate-900 font-black mt-2">DATA: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Conteúdo Fluído */}
        <div className="px-[20mm] py-[8mm]">
          <div className="border-b-2 border-slate-900 mb-6 pb-2">
            <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-[0.15em] m-0">RELATÓRIO DE PRÉ-AUDITORIA JURÍDICA</h2>
          </div>

          <div className="flex flex-col">
            {lines.map((line, idx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return <div key={idx} className="h-4"></div>;

              if (trimmedLine.startsWith('# ')) return null;
              if (trimmedLine.toLowerCase().startsWith('aqui está') || 
                  trimmedLine.toLowerCase().startsWith('realizada conforme')) return null;

              // Títulos de Seção: Protegidos para não ficarem sozinhos no fim da página
              if (trimmedLine.startsWith('## ')) {
                return (
                  <div key={idx} className="bg-slate-900 text-white px-5 py-3.5 my-6 flex items-center gap-3" style={{ breakInside: 'avoid' }}>
                    <div className="w-1.5 h-4 bg-[#f5511e]"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] m-0">{trimmedLine.replace('## ', '')}</h3>
                  </div>
                );
              }

              // Dados da Ficha: Cada linha é um bloco indivisível
              if (trimmedLine.startsWith('- **') && trimmedLine.includes('**: ')) {
                const [label, value] = trimmedLine.replace('- **', '').split('**: ');
                return (
                  <div key={idx} className="grid grid-cols-12 border-b border-slate-50 py-4 gap-6 items-baseline" style={{ breakInside: 'avoid' }}>
                    <div className="col-span-4">
                      <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
                    </div>
                    <div className="col-span-8">
                      <span className="text-[12px] text-slate-900 font-bold leading-relaxed">{value}</span>
                    </div>
                  </div>
                );
              }

              // Bloco de Risco: Score + Classificação ficam juntos
              if (trimmedLine.includes('Índice de Exposição:')) {
                const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
                // Encontra a próxima linha de classificação para agrupar
                const nextLine = lines[idx + 1] || '';
                const classification = nextLine.includes('Classificação:') ? nextLine.split(': ')[1].replace(/\*/g, '') : '';
                
                return (
                  <div key={idx} className="flex flex-col items-end my-10 pr-6 gap-4" style={{ breakInside: 'avoid' }}>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Classificação: <span className="text-slate-900">{classification}</span></span>
                        <div className={`w-32 h-32 rounded-full border-[8px] flex flex-col items-center justify-center bg-white shadow-xl ${getScoreColor(score).split(' ')[0]} ${getScoreColor(score).split(' ')[1]}`}>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Risco</span>
                            <span className="text-4xl font-black leading-none">{score}</span>
                            <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Pontos</span>
                        </div>
                    </div>
                  </div>
                );
              }

              // Pula a linha de classificação se ela já foi processada acima
              if (trimmedLine.includes('Classificação:') && lines[idx-1]?.includes('Índice de Exposição:')) {
                return null;
              }

              // Listas e Bullets
              if (trimmedLine.startsWith('- ')) {
                return (
                  <div key={idx} className="flex gap-4 mb-3.5 ml-2 pr-6 items-start" style={{ breakInside: 'avoid' }}>
                    <div className="w-1.5 h-1.5 bg-[#f5511e] rounded-full mt-2 shrink-0"></div>
                    <p className="text-[11.5px] text-slate-700 leading-relaxed font-semibold m-0">{trimmedLine.replace('- ', '').replace(/\*\*/g, '')}</p>
                  </div>
                );
              }

              // Aviso Legal
              if (trimmedLine.includes('AVISO LEGAL') || trimmedLine.includes('não substitui parecer')) {
                return (
                  <div key={idx} className="mt-14 p-8 bg-amber-50 border-2 border-amber-100 rounded-xl flex items-center gap-8" style={{ breakInside: 'avoid' }}>
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-amber-800 uppercase mb-1 tracking-[0.2em] m-0">Aviso Legal</h4>
                      <p className="text-[10px] text-amber-900 italic leading-relaxed font-medium m-0">{trimmedLine.replace('# AVISO LEGAL', '').trim()}</p>
                    </div>
                  </div>
                );
              }

              return (
                <p key={idx} className="text-[12px] text-slate-600 leading-relaxed mb-5 pr-10">
                  {trimmedLine.replace(/\*\*/g, '')}
                </p>
              );
            })}
          </div>
        </div>

        {/* Rodapé Dinâmico para ocupar o fim da página se houver espaço */}
        <div className="mt-auto px-[20mm] pb-[12mm]">
          <div className="border-t-2 border-slate-50 pt-6 flex justify-between items-center text-[8px] font-bold text-slate-300 uppercase tracking-[0.6em]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-[#f5511e] rounded-full"></span>
              <span>LegalOps Brasil • IA Corporate</span>
            </div>
            <span>CONFIDENCIAL • UNITÀ ENGENHARIA</span>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center text-slate-400 text-[11px] font-medium no-print pb-20 italic">
        O layout acima foi recalculado para preenchimento harmônico das páginas.
      </div>
    </div>
  );
};

export default ReportDisplay;
