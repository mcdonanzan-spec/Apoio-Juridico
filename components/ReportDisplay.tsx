
import React from 'react';

interface ReportDisplayProps { report: string; }

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  const getScoreColor = (score: number) => {
    if (score <= 30) return 'text-emerald-700 border-emerald-500 bg-emerald-50';
    if (score <= 60) return 'text-amber-600 border-amber-400 bg-amber-50';
    if (score <= 85) return 'text-orange-700 border-orange-500 bg-orange-50';
    return 'text-red-700 border-red-600 bg-red-50';
  };

  // Função para agrupar as linhas em seções lógicas para evitar quebras indevidas
  const parseSections = (text: string) => {
    const lines = text.split('\n');
    const sections: { title: string | null; content: string[] }[] = [];
    let currentSection: { title: string | null; content: string[] } = { title: null, content: [] };

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('# ')) return; // Pula títulos de nível 1 (redundantes)
      
      if (trimmed.startsWith('## ')) {
        if (currentSection.content.length > 0 || currentSection.title) {
          sections.push(currentSection);
        }
        currentSection = { title: trimmed.replace('## ', ''), content: [] };
      } else {
        // Ignorar textos introdutórios chatos da IA
        if (!trimmed.toLowerCase().startsWith('aqui está') && !trimmed.toLowerCase().startsWith('realizada conforme')) {
          currentSection.content.push(line);
        }
      }
    });
    
    if (currentSection.content.length > 0 || currentSection.title) {
      sections.push(currentSection);
    }
    return sections;
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const opt = {
      margin: [10, 0, 10, 0],
      filename: `Relatorio_Tecnico_Unita_${new Date().getTime()}.pdf`,
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
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  const sections = parseSections(report);

  return (
    <div className="max-w-5xl mx-auto my-10 animate-fade-in no-print px-4">
      <div className="flex justify-end mb-8">
        <button 
          onClick={handleDownloadPDF} 
          className="px-10 py-4 bg-[#f5511e] text-white rounded-lg shadow-2xl hover:bg-[#d84315] transition-all font-black text-[12px] uppercase tracking-[0.2em] flex items-center gap-3 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Gerar Relatório A4 Premium
        </button>
      </div>

      <div 
        id="report-content" 
        className="bg-white box-border" 
        style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}
      >
        <div className="h-2.5 bg-[#f5511e] w-full"></div>
        
        {/* Cabeçalho */}
        <div className="px-[20mm] pt-[15mm] pb-[8mm] flex justify-between items-end border-b-2 border-slate-50">
          <div>
            <h1 className="text-[42px] font-black text-slate-800 tracking-tighter leading-none m-0">unit<span className="text-[#f5511e]">à</span></h1>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.5em] uppercase m-0 leading-none mt-1.5">Engenharia</p>
          </div>
          
          <div className="text-right text-[9px] text-slate-400 font-bold leading-relaxed uppercase">
            <p className="m-0 tracking-widest text-slate-800 mb-1">AUDITORIA TÉCNICA DE CONTRATOS</p>
            <p className="m-0">contato@unitaengenharia.com.br</p>
            <p className="m-0">Rua Peixoto Gomide, 996 - São Paulo</p>
            <p className="m-0 text-slate-900 font-black mt-2">EMISSÃO: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Corpo do Documento Baseado em Seções */}
        <div className="px-[20mm] py-[10mm]">
          <div className="border-b-2 border-slate-900 mb-8 pb-3">
            <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em] m-0">RELATÓRIO DE PRÉ-AUDITORIA JURÍDICA</h2>
          </div>

          <div className="space-y-6">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="break-inside-avoid mb-10">
                {/* Título da Seção */}
                {section.title && (
                  <div className="bg-slate-900 text-white px-5 py-3 mb-6 flex items-center gap-3">
                    <div className="w-1 h-4 bg-[#f5511e]"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] m-0">{section.title}</h3>
                  </div>
                )}

                {/* Conteúdo da Seção */}
                <div className="space-y-0">
                  {section.content.map((line, lIdx) => {
                    const trimmedLine = line.trim();
                    
                    // Renderização de Campos Chave
                    if (trimmedLine.startsWith('- **') && trimmedLine.includes('**: ')) {
                      const [label, value] = trimmedLine.replace('- **', '').split('**: ');
                      return (
                        <div key={lIdx} className="grid grid-cols-12 border-b border-slate-100 py-4 gap-6 items-baseline">
                          <div className="col-span-4">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
                          </div>
                          <div className="col-span-8">
                            <span className="text-[11.5px] text-slate-900 font-bold leading-relaxed">{value}</span>
                          </div>
                        </div>
                      );
                    }

                    // Renderização de Badge de Risco
                    if (trimmedLine.includes('Índice de Exposição:')) {
                      const score = parseInt(trimmedLine.match(/\d+/)?.[0] || '0');
                      return (
                        <div key={lIdx} className="flex flex-col items-end my-8 pr-4">
                          <div className={`w-32 h-32 rounded-full border-[8px] flex flex-col items-center justify-center bg-white shadow-2xl ${getScoreColor(score).split(' ')[0]} ${getScoreColor(score).split(' ')[1]}`}>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Risco</span>
                            <span className="text-4xl font-black leading-none">{score}</span>
                            <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Pontos</span>
                          </div>
                        </div>
                      );
                    }

                    // Status de Classificação
                    if (trimmedLine.includes('Classificação:')) {
                      const val = trimmedLine.split(': ')[1].replace(/\*/g, '');
                      return (
                        <div key={lIdx} className="text-right pr-6 -mt-8 mb-6">
                          <span className="text-[9px] font-black uppercase text-slate-300 mr-3">Classificação:</span>
                          <span className="text-[14px] font-black text-slate-800 uppercase tracking-[0.2em] border-b-2 border-slate-900 pb-0.5">{val}</span>
                        </div>
                      );
                    }

                    // Bullets
                    if (trimmedLine.startsWith('- ')) {
                      return (
                        <div key={lIdx} className="flex gap-4 mb-4 ml-2 pr-6 items-start">
                          <div className="w-1.5 h-1.5 bg-[#f5511e] rounded-full mt-2 shrink-0"></div>
                          <p className="text-[11px] text-slate-700 leading-relaxed font-semibold m-0">{trimmedLine.replace('- ', '').replace(/\*\*/g, '')}</p>
                        </div>
                      );
                    }

                    // Aviso Legal
                    if (trimmedLine.includes('AVISO LEGAL') || trimmedLine.includes('não substitui parecer')) {
                      return (
                        <div key={lIdx} className="mt-12 p-8 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl flex items-start gap-6">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          </div>
                          <div>
                            <h4 className="text-[9px] font-black text-amber-800 uppercase mb-1.5 tracking-widest m-0">Isenção de Responsabilidade</h4>
                            <p className="text-[10px] text-amber-900 italic leading-relaxed font-medium m-0">{trimmedLine.replace('# AVISO LEGAL', '').trim()}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <p key={lIdx} className="text-[11px] text-slate-600 leading-relaxed mb-4 pr-10">
                        {trimmedLine.replace(/\*\*/g, '')}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé Final */}
        <div className="mt-auto px-[20mm] pb-[15mm]">
          <div className="border-t-2 border-slate-50 pt-6 flex justify-between items-center text-[8px] font-bold text-slate-300 uppercase tracking-[0.5em]">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#f5511e] rounded-full"></span>
              <span>LegalOps Brasil • Soluções Digitais</span>
            </div>
            <span>CONFIDENCIAL • UNITÀ ENGENHARIA</span>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center text-slate-400 text-[11px] font-medium no-print pb-20 italic">
        Nota: Este relatório foi gerado automaticamente e o layout é otimizado para manutenção da integridade lógica das informações em cada página.
      </div>
    </div>
  );
};

export default ReportDisplay;
