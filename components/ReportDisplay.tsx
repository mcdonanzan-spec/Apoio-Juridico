
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
    
    // Configuração de Nível Sênior: Alinhamento milimétrico para A4
    const opt = {
      margin: 0, // Fundamental: Margem 0 no motor para não cortar o conteúdo do canvas
      filename: `Relatorio_Unita_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3, // Aumentado para máxima nitidez em textos pequenos
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
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
          className="px-8 py-3 bg-[#f5511e] text-white rounded shadow-xl hover:bg-[#d84315] transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-3 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Exportar PDF Profissional
        </button>
      </div>

      {/* Container A4 Real: 210mm de largura garante alinhamento perfeito no motor PDF */}
      <div 
        id="report-content" 
        className="bg-white box-border" 
        style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}
      >
        <div className="h-2 bg-[#f5511e] w-full"></div>
        
        {/* Cabeçalho Otimizado - Padding de 15mm para margem de segurança física */}
        <div className="px-[15mm] pt-[10mm] pb-[6mm] flex justify-between items-end border-b border-slate-100">
          <div>
            <h1 className="text-[34px] font-black text-slate-800 tracking-tighter leading-none m-0">unit<span className="text-[#f5511e]">à</span></h1>
            <p className="text-[9px] font-black text-slate-400 tracking-[0.4em] uppercase m-0 leading-none mt-1">Engenharia</p>
          </div>
          
          <div className="text-right text-[8px] text-slate-400 font-bold leading-tight uppercase">
            <p className="m-0">contato@unitaengenharia.com.br • www.unitaengenharia.com.br</p>
            <p className="m-0">Rua Peixoto Gomide, 996 - São Paulo - SP</p>
            <p className="m-0 text-slate-900 font-black mt-1">DATA DE EMISSÃO: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Corpo do Documento */}
        <div className="px-[15mm] py-[8mm]">
          <div className="border-b border-slate-900 mb-6 pb-2">
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest m-0">FICHA RESUMO DO CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
          </div>

          <div className="space-y-0">
            {report.split('\n').map((line, idx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return <div key={idx} className="h-4"></div>;

              if (trimmedLine.startsWith('# ')) return null;
              if (trimmedLine.toLowerCase().startsWith('aqui está') || 
                  trimmedLine.toLowerCase().startsWith('realizada conforme')) return null;

              // Títulos de Seção com Quebra de Página Inteligente
              if (trimmedLine.startsWith('## ')) {
                return (
                  <div key={idx} className="bg-slate-50 border-l-[3px] border-slate-800 px-4 py-2 mt-6 mb-3 break-inside-avoid">
                    <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest m-0">{trimmedLine.replace('## ', '')}</h3>
                  </div>
                );
              }

              // Dados da Ficha
              if (trimmedLine.startsWith('- **') && trimmedLine.includes('**: ')) {
                const [label, value] = trimmedLine.replace('- **', '').split('**: ');
                return (
                  <div key={idx} className="grid grid-cols-12 border-b border-slate-50 py-2.5 items-start gap-4 break-inside-avoid">
                    <div className="col-span-3">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-tight block leading-tight">{label}</span>
                    </div>
                    <div className="col-span-9">
                      <span className="text-[10.5px] text-slate-900 font-bold leading-relaxed block">{value}</span>
                    </div>
                  </div>
                );
              }

              // Índice de Risco (Badge Centralizado para PDF)
              if (trimmedLine.includes('Índice de Exposição:')) {
                const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
                return (
                  <div key={idx} className="flex justify-end my-8 pr-4 break-inside-avoid">
                    <div className={`w-28 h-28 rounded-full border-[6px] flex flex-col items-center justify-center bg-white shadow-lg ${getScoreColor(score).split(' ')[0]} ${getScoreColor(score).split(' ')[1]}`}>
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-tighter">Exposição</span>
                      <span className="text-3xl font-black leading-none">{score}</span>
                      <span className="text-[7px] font-bold uppercase tracking-[0.2em]">Pontos</span>
                    </div>
                  </div>
                );
              }

              if (trimmedLine.includes('Classificação:')) {
                const val = trimmedLine.split(': ')[1].replace(/\*/g, '');
                return (
                  <div key={idx} className="text-right pr-6 -mt-6 mb-8 break-inside-avoid">
                    <span className="text-[8px] font-black uppercase text-slate-300 mr-2">Status:</span>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest border-b border-slate-800 pb-0.5">{val}</span>
                  </div>
                );
              }

              // Listas e Bullets
              if (trimmedLine.startsWith('- ')) {
                return (
                  <div key={idx} className="flex gap-3 mb-2 ml-1 pr-6 items-start break-inside-avoid">
                    <div className="w-1.5 h-1.5 bg-[#f5511e] rounded-full mt-1.5 shrink-0"></div>
                    <p className="text-[10px] text-slate-700 leading-normal font-semibold m-0">{trimmedLine.replace('- ', '').replace(/\*\*/g, '')}</p>
                  </div>
                );
              }

              // Aviso Legal Final
              if (trimmedLine.includes('AVISO LEGAL') || trimmedLine.includes('não substitui parecer')) {
                return (
                  <div key={idx} className="mt-10 p-5 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-4 break-inside-avoid">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                      <h4 className="text-[8px] font-black text-amber-800 uppercase mb-0.5 tracking-wider m-0">Aviso Legal</h4>
                      <p className="text-[9px] text-amber-900 italic leading-relaxed font-medium m-0">{trimmedLine.replace('# AVISO LEGAL', '').trim()}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="break-inside-avoid">
                  <p className="text-[10px] text-slate-600 leading-normal mb-3 pr-6">{trimmedLine.replace(/\*\*/g, '')}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé Corporativo Padrão A4 */}
        <div className="mt-auto px-[15mm] pb-[10mm]">
          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[7px] font-bold text-slate-300 uppercase tracking-[0.4em]">
            <span>LegalOps Brasil • Tecnologia Jurídica</span>
            <span>Relatório Confidencial • Unità Engenharia</span>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center text-slate-400 text-[10px] font-medium no-print pb-20 italic">
        Nota: Documento configurado para impressão física em papel A4 padrão.
      </div>
    </div>
  );
};

export default ReportDisplay;
