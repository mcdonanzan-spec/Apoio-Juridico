
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
    
    // Configuração de PDF otimizada para evitar cortes e garantir clareza
    const opt = {
      margin: [0, 0, 0, 0], // Margem zero no motor para controlar via CSS
      filename: `Ficha_Unita_Resumo_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, // Aumenta a nitidez do texto
        useCORS: true,
        letterRendering: true,
        width: 794, // Largura padrão A4 em 96dpi
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: '#FFFFFF'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['css', 'legacy'] } // Usa estritamente as classes CSS para quebra
    };
    
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-5xl mx-auto my-10 animate-fade-in no-print px-4">
      <div className="flex justify-end mb-6">
        <button 
          onClick={handleDownloadPDF} 
          className="px-8 py-3 bg-[#f5511e] text-white rounded shadow-2xl hover:shadow-none hover:bg-[#d84315] transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-3 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Gerar PDF Corporativo
        </button>
      </div>

      {/* Container Principal do PDF - Largura A4 Fixa */}
      <div 
        id="report-content" 
        className="bg-white relative shadow-sm" 
        style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: "'Inter', sans-serif", color: '#1e293b' }}
      >
        {/* Faixa decorativa superior */}
        <div className="h-1.5 bg-[#f5511e] w-full"></div>
        
        {/* Header Ultra-Compacto para evitar espaço morto */}
        <div className="px-12 pt-6 pb-4 flex justify-between items-center border-b border-slate-100">
          <div>
            <h1 className="text-[32px] font-black text-slate-800 tracking-tighter leading-none m-0">unit<span className="text-[#f5511e]">à</span></h1>
            <p className="text-[8px] font-black text-slate-400 tracking-[0.4em] uppercase m-0 leading-none mt-0.5">Engenharia</p>
          </div>
          
          <div className="text-right text-[8px] text-slate-400 font-bold leading-tight">
            <p className="m-0 uppercase">contato@unitaengenharia.com.br • www.unitaengenharia.com.br</p>
            <p className="m-0 uppercase">Rua Peixoto Gomide, 996 - São Paulo - SP</p>
            <div className="mt-1 flex justify-end items-center gap-2">
              <span className="h-2 w-px bg-slate-200"></span>
              <p className="m-0 text-slate-900 font-black">EMISSÃO: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Corpo do Documento */}
        <div className="px-12 py-6">
          <div className="border-b-2 border-slate-900 mb-6 pb-1">
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em] m-0">FICHA RESUMO DO CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
          </div>

          <div className="space-y-0">
            {report.split('\n').map((line, idx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return null;

              // Filtros de conteúdo indesejado
              if (trimmedLine.startsWith('# ')) return null;
              if (trimmedLine.toLowerCase().startsWith('aqui está') || 
                  trimmedLine.toLowerCase().startsWith('realizada conforme') ||
                  trimmedLine.toLowerCase().startsWith('segue a análise')) {
                return null;
              }

              // Seções (Cabeçalhos de Bloco) - Força não quebrar no título
              if (trimmedLine.startsWith('## ')) {
                return (
                  <div key={idx} className="bg-slate-50 border-l-[3px] border-slate-800 px-4 py-1.5 my-4" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest m-0">{trimmedLine.replace('## ', '')}</h3>
                  </div>
                );
              }

              // Dados da Ficha (Grid de Informações)
              if (trimmedLine.startsWith('- **') && trimmedLine.includes('**: ')) {
                const [label, value] = trimmedLine.replace('- **', '').split('**: ');
                return (
                  <div key={idx} className="grid grid-cols-12 border-b border-slate-50 py-2 items-start gap-4" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className="col-span-3">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-tight pt-0.5 block leading-tight">{label}</span>
                    </div>
                    <div className="col-span-9">
                      <span className="text-[10px] text-slate-900 font-bold leading-relaxed block">{value}</span>
                    </div>
                  </div>
                );
              }

              // Gráfico de Risco / Pontuação
              if (trimmedLine.includes('Índice de Exposição:')) {
                const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
                return (
                  <div key={idx} className="flex justify-end my-6 pr-4" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className={`w-24 h-24 rounded-full border-[5px] flex flex-col items-center justify-center bg-white shadow-lg ${getScoreColor(score).split(' ')[0]} ${getScoreColor(score).split(' ')[1]}`}>
                      <span className="text-[7px] font-black uppercase text-slate-400 mb-0 tracking-tighter">Grau de Risco</span>
                      <span className="text-3xl font-black leading-none">{score}</span>
                      <span className="text-[7px] font-bold uppercase tracking-[0.1em] mt-0">Pontos</span>
                    </div>
                  </div>
                );
              }

              // Status Qualitativo
              if (trimmedLine.includes('Classificação:')) {
                const val = trimmedLine.split(': ')[1].replace(/\*/g, '');
                return (
                  <div key={idx} className="text-right pr-6 -mt-6 mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <span className="text-[8px] font-black uppercase text-slate-300 mr-2">Status da Análise:</span>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest border-b border-slate-800 pb-0.5">{val}</span>
                  </div>
                );
              }

              // Bullet Points de Texto
              if (trimmedLine.startsWith('- ')) {
                return (
                  <div key={idx} className="flex gap-2.5 mb-1.5 ml-1 pr-4 items-start" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className="w-1 h-1 bg-[#f5511e] rounded-full mt-1.5 shrink-0"></div>
                    <p className="text-[10px] text-slate-700 leading-normal font-semibold m-0">{trimmedLine.replace('- ', '').replace(/\*\*/g, '')}</p>
                  </div>
                );
              }

              // Box de Aviso Legal
              if (trimmedLine.includes('AVISO LEGAL') || trimmedLine.includes('não substitui parecer')) {
                return (
                  <div key={idx} className="mt-8 p-4 bg-amber-50/50 border border-amber-100 rounded flex items-start gap-4 mr-2" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                      <h4 className="text-[8px] font-black text-amber-800 uppercase mb-0.5 tracking-wider m-0">Aviso de Auditoria Técnica</h4>
                      <p className="text-[9px] text-amber-900 italic leading-snug font-medium m-0">{trimmedLine.replace('# AVISO LEGAL', '').trim()}</p>
                    </div>
                  </div>
                );
              }

              // Parágrafos Comuns
              return <p key={idx} className="text-[10px] text-slate-600 leading-normal mb-2 pr-4">{trimmedLine.replace(/\*\*/g, '')}</p>;
            })}
          </div>
        </div>

        {/* Rodapé Corporativo - Espaçado para o fim da folha */}
        <div className="mt-auto px-12 pt-6 pb-8">
          <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[7px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-[#f5511e] rounded-full"></span>
              <span>LegalOps Brasil • Soluções Digitais</span>
            </div>
            <span>CONFIDENCIAL • UNITÀ ENGENHARIA</span>
          </div>
        </div>
      </div>
      
      {/* Aviso na Tela (não sai no PDF) */}
      <div className="mt-8 text-center text-slate-400 text-[10px] font-medium no-print pb-20 italic">
        Nota: O layout do PDF é otimizado para impressão em folha A4 e visualização corporativa.
      </div>
    </div>
  );
};

export default ReportDisplay;
