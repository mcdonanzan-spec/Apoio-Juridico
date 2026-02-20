
import React, { useState, useCallback } from 'react';
import { LegalAnalysisInput } from '../types';

interface AnalysisFormProps {
  onSubmit: (data: LegalAnalysisInput) => void;
  isLoading: boolean;
}

const AnalysisForm: React.FC<AnalysisFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<Omit<LegalAnalysisInput, 'arquivo' | 'documentoTexto'>>({
    empresa: '',
    cnpj: '',
    papel: '',
    tipoAnalise: 'Revisão Contratual',
    objetivo: '',
    valor: '',
    prazo: '',
    garantia: '',
    multa: '',
    preocupacoes: '',
    urgencia: 'Média',
  });

  const [selectedFile, setSelectedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const [manualText, setManualText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (file: File) => {
    if (file && (file.type === 'application/pdf' || file.type === 'text/plain')) {
      const base64 = await fileToBase64(file);
      setSelectedFile({
        name: file.name,
        data: base64,
        mimeType: file.type
      });
      setManualText(''); // Clear manual text if file is chosen
    } else {
      alert("Por favor, envie apenas arquivos PDF ou TXT.");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !manualText) {
      alert("Por favor, anexe um documento ou insira o texto para análise.");
      return;
    }
    onSubmit({
      ...formData,
      arquivo: selectedFile || undefined,
      documentoTexto: manualText || undefined
    });
  };

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-slate-50/50";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-slate-100">
      
      {/* Seção 1: Identificação */}
      <div className="border-b border-slate-100 pb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">01</span>
          Identificação Institucional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Empresa Representada</label>
            <input name="empresa" value={formData.empresa} onChange={handleChange} placeholder="Razão Social" className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>CNPJ</label>
            <input name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Papel no Documento</label>
            <select name="papel" value={formData.papel} onChange={handleChange} className={inputClass} required>
              <option value="">Selecione seu papel...</option>
              <option value="Contratante">Contratante / Dono da Obra</option>
              <option value="Contratada">Contratada / Empreiteiro</option>
              <option value="Incorporadora">Incorporadora</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Comprador">Comprador</option>
              <option value="Intermediário">Intermediário / Corretora</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Tipo de Análise</label>
            <select name="tipoAnalise" value={formData.tipoAnalise} onChange={handleChange} className={inputClass}>
              <option>Revisão de Contrato de Empreitada</option>
              <option>Análise de Edital (Lei 14.133)</option>
              <option>Distrato Imobiliário</option>
              <option>Convenção de Condomínio</option>
              <option>Memorial Descritivo</option>
              <option>Acordo Extrajudicial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Seção 2: Parâmetros Financeiros */}
      <div className="border-b border-slate-100 pb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">02</span>
          Parâmetros Críticos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>Valor do Negócio</label>
            <input name="valor" value={formData.valor} onChange={handleChange} placeholder="R$ 0.000,00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Multa Prevista</label>
            <input name="multa" value={formData.multa} onChange={handleChange} placeholder="Ex: 20% do saldo" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Garantias Oferecidas</label>
            <input name="garantia" value={formData.garantia} onChange={handleChange} placeholder="Ex: Seguro Garantia" className={inputClass} />
          </div>
        </div>
        <div className="mt-5">
          <label className={labelClass}>Urgência da Análise</label>
          <div className="flex flex-wrap gap-3">
            {['Baixa', 'Média', 'Alta', 'Crítica'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData(p => ({ ...p, urgencia: level }))}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all border ${
                  formData.urgencia === level 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Seção 3: O Documento (Upload de Alta Capacidade) */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">03</span>
          Anexar Documento Jurídico
        </h3>
        
        {!selectedFile ? (
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 bg-slate-50'
            }`}
          >
            <input 
              type="file" 
              accept=".pdf,.txt" 
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <h4 className="text-slate-800 font-bold">Arraste o documento aqui</h4>
              <p className="text-slate-500 text-sm mt-1">Suporte para PDF e TXT (máx. 20MB)</p>
              <button type="button" className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:shadow-sm">Selecionar Arquivo</button>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">PDF</div>
              <div>
                <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-blue-600">Arquivo pronto para análise</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setSelectedFile(null)}
              className="p-2 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-slate-100"></div>
            <span className="text-xs font-bold text-slate-400 uppercase">ou cole o texto manualmente</span>
            <div className="h-px flex-1 bg-slate-100"></div>
          </div>
          <textarea 
            value={manualText}
            onChange={(e) => {
              setManualText(e.target.value);
              if (e.target.value) setSelectedFile(null);
            }}
            rows={selectedFile ? 2 : 8}
            placeholder="Se não tiver o arquivo, cole as cláusulas aqui para uma análise rápida..."
            className={`${inputClass} font-mono text-sm resize-none`}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-5 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-3 text-lg ${
          isLoading ? 'bg-slate-400 cursor-wait' : 'bg-slate-900 hover:bg-black shadow-xl shadow-slate-200 active:scale-[0.98]'
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            IA Processando Dados...
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944V22m0-19.056c1.11 0 2.029.793 2.029 1.772v13.512c0 .98-.919 1.772-2.029 1.772m0-17.056c-1.11 0-2.029.793-2.029 1.772v13.512c0 .98.919 1.772 2.029 1.772"></path></svg>
            Iniciar Auditoria Jurídica Digital
          </>
        )}
      </button>
    </form>
  );
};

export default AnalysisForm;
