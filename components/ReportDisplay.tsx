
import React from 'react';

interface ReportDisplayProps { report: string; }

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  const getScoreColor = (text: string) => {
    const scoreMatch = text.match(/\d+/);
    const score = scoreMatch ? parseInt(scoreMatch[0]) : 0;
    if (score <= 25) return 'text-green-700 bg-green-50 border-green-200';
    if (score <= 50) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    if (score <= 75) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Auditoria_Juridica_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-5xl mx-auto my-10 animate-fade-in">
      <div className="flex justify-end gap-3 mb-6 no-print">
        <button onClick={handleDownloadPDF} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg font-semibold text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          Exportar Relatório Oficial (PDF)
        </button>
      </div>

      <div id="report-content" className="bg-white p-8 md:p-16 rounded-2xl shadow-2xl border border-slate-100">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-8 mb-10">
          <div>
            <h1 className="text-4xl font-serif text-slate-900 mb-2">LegalOps Brasil</h1>
            <p className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              Inteligência Jurídica em Engenharia e Incorporação
            </p>
          </div>
          <div className="mt-6 md:mt-0 text-right bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Protocolo de Auditoria</p>
            <p className="text-sm font-mono font-bold text-slate-700">ID-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          {report.split('\n').map((line, idx) => {
            const trimmedLine = line.trim();
            if (!trimmedLine && line !== '') return <div key={idx} className="h-4"></div>;

            // Títulos de Seção
            if (trimmedLine.startsWith('# ')) {
              return <h2 key={idx} className="text-2xl font-black text-slate-900 mt-12 mb-6 border-b-4 border-slate-900 pb-2 uppercase tracking-tight">{trimmedLine.replace('# ', '')}</h2>;
            }

            // Headers de Nível 2
            if (trimmedLine.startsWith('## ')) {
              const headerText = trimmedLine.replace('## ', '');
              return (
                <div key={idx} className={`mt-10 mb-6 ${headerText.includes('Ficha Resumo') ? 'bg-blue-50 p-4 rounded-xl border-l-8 border-blue-600' : ''}`}>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">{headerText}</h3>
                </div>
              );
            }

            // Estilização da Ficha Resumo solicitada pela advogada
            if (trimmedLine.includes(': ') && (trimmedLine.match(/^[0-9]\./) || trimmedLine.startsWith('- '))) {
              const [label, ...valueParts] = trimmedLine.split(': ');
              const value = valueParts.join(': ');
              return (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors px-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase md:col-span-1 leading-tight">{label.replace(/^[0-9]\.\s*/, '').replace('- ', '')}</span>
                  <span className="text-sm text-slate-800 md:col-span-3 font-medium">{value}</span>
                </div>
              );
            }

            // Módulo de Score com Explicação de Metodologia
            if (trimmedLine.includes('Score Numérico:')) {
              return (
                <div key={idx} className="my-10">
                  <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-slate-900 text-white rounded-3xl shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                      <svg className="w-64 h-64 translate-x-10 -translate-y-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                    </div>
                    
                    <div className={`flex flex-col items-center justify-center w-36 h-36 rounded-2xl border-2 shadow-2xl shrink-0 ${getScoreColor(trimmedLine)}`}>
                      <span className="text-5xl font-black">{trimmedLine.replace(/[^0-9]/g, '')}</span>
                      <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">Pontuação</span>
                    </div>

                    <div className="flex-1 space-y-3">
                      <h4 className="text-lg font-bold text-blue-400">Como este score é calculado?</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        Nossa IA aplica uma <strong>Matriz de Risco Ponderada</strong> baseada em: Financeiro (30%), Trabalhista (25%), Jurídico Estrutural (20%), Operacional (15%) e Estratégico (10%).
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                        <div className="text-[10px] bg-white/10 p-2 rounded border border-white/5"><span className="block font-bold text-green-400">0-25</span> Baixo (Bom)</div>
                        <div className="text-[10px] bg-white/10 p-2 rounded border border-white/5"><span className="block font-bold text-yellow-400">26-50</span> Médio</div>
                        <div className="text-[10px] bg-white/10 p-2 rounded border border-white/5"><span className="block font-bold text-orange-400">51-75</span> Alto</div>
                        <div className="text-[10px] bg-white/10 p-2 rounded border border-white/5"><span className="block font-bold text-red-400">76-100</span> Crítico</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Justificativa do Score (Itens de Metodologia)
            if (trimmedLine.startsWith('- Justificativa')) {
              return (
                <div key={idx} className="p-6 bg-slate-50 border border-slate-200 rounded-xl mb-8">
                  <p className="text-sm text-slate-700 italic"><strong>Fundamentação do Score:</strong> {trimmedLine.split(': ')[1]}</p>
                </div>
              );
            }

            // Aviso Legal Final
            if (trimmedLine.startsWith('DECLARAÇÃO FINAL') || trimmedLine.includes('não substitui parecer jurídico formal')) {
              return (
                <div key={idx} className="mt-16 p-8 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center gap-6">
                  <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <div className="text-xs text-amber-900 leading-relaxed font-medium">
                    {trimmedLine}
                  </div>
                </div>
              );
            }

            return <p key={idx} className="text-slate-700 leading-relaxed text-base mb-4">{trimmedLine}</p>;
          })}
        </div>
        
        <div className="mt-20 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Documento gerado eletronicamente por LegalOps Brasil via Google Gemini API</p>
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;
