import * as XLSX from 'xlsx';
import { PlanilhaLinha } from '../types';

const STORAGE_KEY = 'legalops_matriz_contratos_consolidada_v1';

/**
 * Normaliza o texto para inserção em células de planilha,
 * removendo asteriscos de markdown e quebras excessivas.
 */
function cleanCellText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/#{1,6}\s*/g, '')
    .trim();
}

/**
 * Recupera todas as linhas de contratos já analisados e acumulados no armazenamento local.
 */
export function getLinhasConsolidadas(): PlanilhaLinha[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao ler linhas consolidadas da planilha:', err);
    return [];
  }
}

/**
 * Adiciona ou atualiza linhas do contrato na matriz consolidada.
 * Se uma linha com mesmo ID Contrato e mesma Cláusula já existir, ela é atualizada.
 */
export function salvarLinhasNaMatriz(novasLinhas: PlanilhaLinha[]): PlanilhaLinha[] {
  if (!novasLinhas || novasLinhas.length === 0) return getLinhasConsolidadas();

  const existentes = getLinhasConsolidadas();
  const mapa = new Map<string, PlanilhaLinha>();

  // Primeiro adiciona os existentes
  existentes.forEach((l) => {
    const chave = `${(l.idContrato || '').trim().toUpperCase()}___${(l.clausulaAuditada || '').trim().toUpperCase()}`;
    mapa.set(chave, l);
  });

  // Sobrescreve/adiciona os novos
  novasLinhas.forEach((l) => {
    const chave = `${(l.idContrato || '').trim().toUpperCase()}___${(l.clausulaAuditada || '').trim().toUpperCase()}`;
    mapa.set(chave, l);
  });

  const consolidada = Array.from(mapa.values());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consolidada));
  } catch (err) {
    console.error('Erro ao salvar linhas consolidadas:', err);
  }

  return consolidada;
}

/**
 * Limpa todo o histórico consolidado de contratos.
 */
export function limparHistoricoPlanilha(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Erro ao limpar histórico da planilha:', err);
  }
}

/**
 * Remove linhas de um contrato específico do histórico consolidado.
 */
export function removerContratoDoHistorico(idContrato: string): PlanilhaLinha[] {
  const existentes = getLinhasConsolidadas();
  const filtradas = existentes.filter(
    (l) => (l.idContrato || '').trim().toUpperCase() !== idContrato.trim().toUpperCase()
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtradas));
  } catch (err) {
    console.error('Erro ao atualizar histórico:', err);
  }
  return filtradas;
}

/**
 * Copia os dados em formato TSV (Tab-Separated Values).
 * Permite colar diretamente no Excel ou Google Sheets via Ctrl+V,
 * preenchendo exatamente as colunas A a F!
 */
export async function copiarParaClipboardExcel(linhas: PlanilhaLinha[]): Promise<boolean> {
  if (!linhas || linhas.length === 0) return false;

  const cabecalho = [
    'ID Contrato',
    'Tipo / Objeto',
    'Cláusula Auditada',
    'Diagnóstico / Vício',
    'Redação Blindada (Sugestão)',
    'Fundamentação Legal',
  ].join('\t');

  const corpo = linhas
    .map((l) => {
      const colA = cleanCellText(l.idContrato || 'CTR');
      const colB = cleanCellText(l.tipoObjeto || 'Contrato');
      const colC = cleanCellText(l.clausulaAuditada || '');
      // Em TSV, quebras de linha dentro da célula devem ser envolvidas em aspas duplas
      const colD = `"${cleanCellText(l.diagnosticoVicio || '').replace(/"/g, '""')}"`;
      const colE = `"${cleanCellText(l.redacaoBlindada || '').replace(/"/g, '""')}"`;
      const colF = `"${cleanCellText(l.fundamentacaoLegal || '').replace(/"/g, '""')}"`;

      return [colA, colB, colC, colD, colE, colF].join('\t');
    })
    .join('\n');

  const textoCompleto = `${cabecalho}\n${corpo}`;

  try {
    await navigator.clipboard.writeText(textoCompleto);
    return true;
  } catch (err) {
    console.error('Falha ao copiar para a área de transferência:', err);
    return false;
  }
}

/**
 * Exporta para arquivo nativo Excel (.xlsx) com auto-ajuste de colunas e cabeçalhos formatados.
 */
export function exportarParaExcelXLSX(linhas: PlanilhaLinha[], nomeArquivoBase: string = 'Auditoria_Contratos_CTR'): void {
  if (!linhas || linhas.length === 0) return;

  const dadosFormatados = linhas.map((l) => ({
    'ID Contrato': cleanCellText(l.idContrato || 'CTR'),
    'Tipo / Objeto': cleanCellText(l.tipoObjeto || 'Instrumento Contratual'),
    'Cláusula Auditada': cleanCellText(l.clausulaAuditada || ''),
    'Diagnóstico / Vício': cleanCellText(l.diagnosticoVicio || ''),
    'Redação Blindada (Sugestão)': cleanCellText(l.redacaoBlindada || ''),
    'Fundamentação Legal': cleanCellText(l.fundamentacaoLegal || ''),
  }));

  const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);

  // Definir larguras ideais para as colunas A a F
  worksheet['!cols'] = [
    { wch: 14 }, // ID Contrato
    { wch: 32 }, // Tipo / Objeto
    { wch: 28 }, // Cláusula Auditada
    { wch: 48 }, // Diagnóstico / Vício
    { wch: 55 }, // Redação Blindada (Sugestão)
    { wch: 35 }, // Fundamentação Legal
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Matriz de Auditoria');

  const safeName = nomeArquivoBase.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `${safeName}.xlsx`);
}

/**
 * Exporta para arquivo CSV padrão brasileiro (ponto e vírgula e BOM UTF-8 para o Excel abrir direto sem erro).
 */
export function exportarParaCSV(linhas: PlanilhaLinha[], nomeArquivoBase: string = 'Auditoria_Contratos_CTR'): void {
  if (!linhas || linhas.length === 0) return;

  const cabecalho = 'ID Contrato;Tipo / Objeto;Cláusula Auditada;Diagnóstico / Vício;Redação Blindada (Sugestão);Fundamentação Legal\r\n';

  const corpo = linhas
    .map((l) => {
      const formatCell = (val: string | undefined | null) => {
        const text = cleanCellText(val);
        return `"${text.replace(/"/g, '""')}"`;
      };

      return [
        formatCell(l.idContrato || 'CTR'),
        formatCell(l.tipoObjeto || 'Contrato'),
        formatCell(l.clausulaAuditada || ''),
        formatCell(l.diagnosticoVicio || ''),
        formatCell(l.redacaoBlindada || ''),
        formatCell(l.fundamentacaoLegal || ''),
      ].join(';');
    })
    .join('\r\n');

  // \uFEFF adiciona o Byte Order Mark (BOM) para o Excel interpretar acentos em UTF-8 perfeitamente
  const csvContent = `\uFEFF${cabecalho}${corpo}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  const safeName = nomeArquivoBase.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
