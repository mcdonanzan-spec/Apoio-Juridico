
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
    
    // Ajuste fino para evitar cortes: largura de 210mm e escala controlada.
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `Relatorio_Auditoria_Unita.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollY: 0,
        windowWidth: 800 // Força uma largura estável para o canvas
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
          Exportar PDF Corporativo
        </button>
      </div>

      <div 
        id="report-content" 
        className="bg-white relative overflow-visible box-border shadow-sm border border-slate-100" 
        style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '0' }}
      >
        {/* Faixa Superior */}
        <div className="h-4 bg-[#f5511e] w-full"></div>
        
        {/* Cabeçalho Papel Timbrado */}
        <div className="px-14 py-12 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">unit<span className="text-[#f5511e]">à</span></h1>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase mt-1">Engenharia</p>
          </div>
          
          <div className="text-right text-[10px] text-slate-400 font-medium leading-relaxed">
            <p>contato@unitaengenharia.com.br</p>
            <p>www.unitaengenharia.com.br</p>
            <p>Rua Peixoto Gomide, 996 - São Paulo</p>
            <p className="text-slate-800 font-bold mt-2 uppercase tracking-tight">DATA DE EMISSÃO: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="px-14 pb-20">
          <div className="border-b-2 border-slate-900 mb-8 pb-1">
            <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Ficha Resumo de Pré-Auditoria de Contrato</h2>
          </div>

          <div className="space-y-0.5">
            {report.split('\n').map((line, idx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return <div key={idx} className="h-4"></div>;

              if (trimmedLine.startsWith('# ')) return null;

              // Seções (Azul Unità / Slate)
              if (trimmedLine.startsWith('## ')) {
                return (
                  <div key={idx} className="bg-slate-50 border-l-4 border-slate-900 px-4 py-2.5 my-8">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">{trimmedLine.replace('## ', '')}</h3>
                  </div>
                );
              }

              // Dados da Ficha (Grid Limpo)
              if (trimmedLine.startsWith('- **') && trimmedLine.includes('**: ')) {
                const [label, value] = trimmedLine.replace('- **', '').split('**: ');
                return (
                  <div key={idx} className="grid grid-cols-12 border-b border-slate-100 py-3 items-start gap-4">
                    <span className="col-span-4 text-[9px] font-black text-slate-400 uppercase pt-1 tracking-tight">{label}</span>
                    <span className="col-span-8 text-[12px] text-slate-800 font-bold leading-snug">{value}</span>
                  </div>
                );
              }

              // Badge de Exposição (Círculo lateral)
              if (trimmedLine.includes('Índice de Exposição:')) {
                const scoreStr = trimmedLine.match(/\d+/)?.[0] || '0';
                const score = parseInt(scoreStr);
                return (
                  <div key={idx} className="flex justify-end my-10 pr-2">
                    <div className={`w-32 h-32 rounded-full border-[6px] flex flex-col items-center justify-center bg-white shadow-xl ${getScoreColor(score).split(' ')[0]} ${getScoreColor(score).split(' ')[1]}`}>
                      <span className="text-[8px] font-black uppercase text-slate-400 mb-0.5 tracking-tighter">Grau de Exposição</span>
                      <span className="text-4xl font-black leading-none">{score}</span>
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] mt-1">Pontos</span>
                    </div>
                  </div>
                );
              }

              // Status Qualitativo
              if (trimmedLine.includes('Classificação:')) {
                const value = trimmedLine.split(': ')[1].replace(/\*/g, '');
                return (
                  <div key={idx} className="text-right pr-6 -mt-8 mb-12">
                    <span className="text-[10px] font-black uppercase text-slate-300 mr-2">Status do Instrumento:</span>
                    <span className="text-[12px] font-black text-slate-700 uppercase tracking-widest border-b-2 border-slate-800 pb-1">{value}</span>
                  </div>
                );
              }

              // Bullet points (Lista técnica)
              if (trimmedLine.startsWith('- ')) {
                return (
                  <div key={idx} className="flex gap-4 mb-3 ml-2 pr-6 items-start">
                    <div className="w-1.5 h-1.5 bg-[#f5511e] rounded-full mt-1.5 shrink-0"></div>
                    <p className="text-[12px] text-slate-700 leading-relaxed font-medium">{trimmedLine.replace('- ', '').replace(/\*\*/g, '')}</p>
                  </div>
                );
              }

              // Aviso Legal (Box no Rodapé)
              if (trimmedLine.includes('AVISO LEGAL') || trimmedLine.includes('não substitui parecer')) {
                return (
                  <div key={idx} className="mt-16 p-6 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-4 mr-6">
                    <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-amber-800 uppercase mb-0.5 tracking-wider">Aviso de Pré-Auditoria Técnica</h4>
                      <p className="text-[11px] text-amber-900 italic leading-relaxed font-medium">{trimmedLine.replace('# AVISO LEGAL', '').trim()}</p>
                    </div>
                  </div>
                );
              }

              return <p key={idx} className="text-[12px] text-slate-600 leading-relaxed mb-4 pr-6">{trimmedLine.replace(/\*\*/g, '')}</p>;
            })}
          </div>
        </div>

        {/* Rodapé Papel Timbrado */}
        <div className="absolute bottom-8 left-14 right-14 border-t border-slate-100 pt-4 flex justify-between items-center text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">
          <span>LegalOps Brasil • IA para Engenharia Civil</span>
          <span className="text-slate-200">Relatório Confidencial • Unità Engenharia</span>
        </div>
      </div>
      
      <div className="mt-8 text-center text-slate-400 text-[10px] pb-10">
        Relatório estruturado com base no modelo de triagem de contratos da Unità Engenharia.
      </div>
    </div>
  );
};

export default ReportDisplay;
