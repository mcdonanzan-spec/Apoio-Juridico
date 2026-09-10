import { jsPDF } from 'jspdf';
import { StructuredAnalysisResult, ChatMessage } from '../types';

/**
 * Utilitário profissional de geração de parecer jurídico em formato PDF vetorial.
 * Gera documento com design corporativo de alta precisão (A4 portrait):
 * - Texto 100% vetorial, nítido e selecionável (pesquisável via Ctrl+F).
 * - Sanitização completa contra mojibake, emojis incompatíveis e markdown bruto.
 * - Cálculo rigoroso de margens e quebras de linha para evitar sobreposições.
 * - Paginação inteligente com cabeçalho contínuo e rodapé "Página X de Y".
 */

/**
 * Limpa e sanitiza textos para a fonte padrão Helvetica (Latin-1/WinAnsi),
 * convertendo emojis em legendas textuais e removendo ruídos de markdown.
 */
function cleanTextForPDF(text: string | undefined | null): string {
  if (!text) return '';
  return text
    // Emojis e símbolos fora do Latin-1 -> texto legível corporativo
    .replace(/⚖️?|⚖/g, '[Jurídico]')
    .replace(/✨/g, '')
    .replace(/🎯/g, '')
    .replace(/⚠️?|⚠/g, '[Atenção]')
    .replace(/✅|✓/g, '[OK]')
    .replace(/❌|✗/g, '[Vício]')
    .replace(/•/g, '-')
    .replace(/&–þ/g, '') // resquício de emojis corrompidos anteriores
    // Limpeza de marcações Markdown
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_{1,2}(.*?)_{1,2}/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^>\s*/gm, '')
    // Normalização tipográfica para Latin-1
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    // Remover caracteres restantes fora de Latin-1 (0x00 a 0xFF) para prevenir caracteres quebrados
    .replace(/[^\x00-\xFF]/g, '')
    .trim();
}

export async function downloadReportAsPDF(
  report: StructuredAnalysisResult,
  chatMessages: ChatMessage[] = []
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginLeft = 15;
  const marginRight = 15;
  const marginTop = 20;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginLeft - marginRight; // 180mm

  let yPos = marginTop;

  // Gerenciador de quebra de página
  const checkPageBreak = (neededHeight: number): boolean => {
    if (yPos + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      yPos = marginTop;
      return true;
    }
    return false;
  };

  // Paleta de Cores Corporativas (RGB)
  const colorNavy = [15, 23, 42] as const; // #0f172a
  const colorAmber = [217, 119, 6] as const; // #d97706
  const colorSlate = [51, 65, 85] as const; // #334155
  const colorLightSlate = [100, 116, 139] as const; // #64748b
  const colorBgGray = [248, 250, 252] as const; // #f8fafc
  const colorBorder = [226, 232, 240] as const; // #e2e8f0

  const getRiskColor = (risco: string) => {
    switch (risco) {
      case 'Crítico':
        return [220, 38, 38] as const; // Vermelho
      case 'Alto':
        return [234, 88, 12] as const; // Laranja
      case 'Médio':
        return [217, 119, 6] as const; // Âmbar
      default:
        return [16, 185, 129] as const; // Verde
    }
  };

  // Helper para títulos de seção com largura segura (sem colisão com badges)
  const drawSectionTitle = (title: string, badge?: string) => {
    checkPageBreak(18); // Garante que o título nunca fique órfão na última linha da página
    yPos += 3;

    // Barra vertical de destaque
    doc.setFillColor(colorNavy[0], colorNavy[1], colorNavy[2]);
    doc.rect(marginLeft, yPos, 3, 7.5, 'F');

    const cleanTitle = cleanTextForPDF(title).toUpperCase();
    const cleanBadge = badge ? cleanTextForPDF(badge) : '';

    if (cleanBadge) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const badgeWidth = doc.getTextWidth(cleanBadge) + 6;
      const badgeX = pageWidth - marginRight - badgeWidth;

      // Chip do badge à direita
      doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
      doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(badgeX, yPos + 0.5, badgeWidth, 6.5, 1.5, 1.5, 'FD');

      doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
      doc.text(cleanBadge, badgeX + (badgeWidth / 2), yPos + 4.8, { align: 'center' });

      // Título à esquerda, limitado para não encostar no badge
      const maxTitleWidth = contentWidth - badgeWidth - 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
      const titleLines = doc.splitTextToSize(cleanTitle, maxTitleWidth);
      doc.text(titleLines[0], marginLeft + 5, yPos + 5.5);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
      doc.text(cleanTitle, marginLeft + 5, yPos + 5.5);
    }

    yPos += 11;
  };

  // =========================================================================
  // PÁGINA 1: CABEÇALHO TIMBRADO E PAINEL EXECUTIVO
  // =========================================================================

  // Faixa superior azul marinho
  doc.setFillColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.rect(0, 0, pageWidth, 4.5, 'F');

  // Topo institucional
  yPos = 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text('LEGALOPS BRASIL', marginLeft, yPos);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colorAmber[0], colorAmber[1], colorAmber[2]);
  doc.text('ADVOCACIA EMPRESARIAL CORPORATIVA', marginLeft + 48, yPos);

  // Metadados à direita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  const versaoStr = `PARECER TÉCNICO-JURÍDICO (v${report.versaoParecer || 1}.0)`;
  const versaoWidth = doc.getTextWidth(versaoStr);
  doc.text(versaoStr, pageWidth - marginRight - versaoWidth, yPos);

  yPos += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
  doc.text('Consultoria Estratégica, Auditoria Contratual e Blindagem de Riscos', marginLeft, yPos);

  const dataStr = `Emissão: ${new Date().toLocaleDateString('pt-BR')} • DOC-${Math.floor(100000 + Math.random() * 900000)}`;
  const dataWidth = doc.getTextWidth(dataStr);
  doc.text(dataStr, pageWidth - marginRight - dataWidth, yPos);

  // Linha separadora do cabeçalho
  yPos += 4.5;
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);

  // NOTA DE GOVERNANÇA & VALIDAÇÃO PROFISSIONAL
  yPos += 5;
  const notaText =
    'NOTA DE GOVERNANÇA & VALIDAÇÃO PROFISSIONAL: Este parecer constitui instrumento de apoio técnico-jurídico corporativo especializado. Suas recomendações, auditoria de vícios e minutas blindadas foram calibradas sob as normas civis e empresariais brasileiras e devem ser formalmente chanceladas pelo advogado responsável antes da subscrição definitiva.';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.2);
  const notaLines = doc.splitTextToSize(notaText, contentWidth - 8);
  const notaHeight = notaLines.length * 3.4 + 5;

  doc.setFillColor(254, 252, 232); // Amarelo suave
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(marginLeft, yPos, contentWidth, notaHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(146, 64, 14);
  doc.text(notaLines, marginLeft + 4, yPos + 3.8);
  yPos += notaHeight + 5;

  // PAINEL DE RISCO & IDENTIFICAÇÃO DO CONTRATO (LAYOUT 2 COLUNAS ANTI-SOBREPOSIÇÃO)
  const rightColWidth = 44;
  const leftColWidth = contentWidth - rightColWidth - 5; // 131mm
  const rightColX = marginLeft + contentWidth - rightColWidth;

  const cleanTitleStr = cleanTextForPDF(report.titulo || 'Parecer de Auditoria Contratual');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const titleLines = doc.splitTextToSize(cleanTitleStr, leftColWidth - 8);

  const cleanPartesStr = `Partes & Objeto: ${cleanTextForPDF(report.partesIdentificadas || 'Instrumento Contratual Corporativo')}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  const partesLines = doc.splitTextToSize(cleanPartesStr, leftColWidth - 8);

  const leftTextTotalHeight = 6 + (titleLines.length * 4.6) + (partesLines.length * 3.6) + 5;
  const panelHeight = Math.max(leftTextTotalHeight, 30);

  // Fundo do Painel
  doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginLeft, yPos, contentWidth, panelHeight, 2, 2, 'FD');

  // Textos da Coluna Esquerda
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text(titleLines, marginLeft + 4, yPos + 6);

  const partesY = yPos + 6 + (titleLines.length * 4.6) + 1.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text(partesLines, marginLeft + 4, partesY);

  // Coluna Direita: Caixa de Score de Risco
  const riskColor = getRiskColor(report.classificacaoRisco);
  const scoreBoxHeight = Math.min(panelHeight - 6, 26);
  const scoreBoxY = yPos + (panelHeight - scoreBoxHeight) / 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.setLineWidth(0.7);
  doc.roundedRect(rightColX + 2, scoreBoxY, rightColWidth - 4, scoreBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
  doc.text('ÍNDICE DE EXPOSIÇÃO', rightColX + (rightColWidth / 2), scoreBoxY + 5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text(`${report.scoreRisco || 50}/100`, rightColX + (rightColWidth / 2), scoreBoxY + 13, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(`RISCO ${(report.classificacaoRisco || 'Médio').toUpperCase()}`, rightColX + (rightColWidth / 2), scoreBoxY + 19, {
    align: 'center',
  });

  yPos += panelHeight + 5;

  // DIRETRIZES & AJUSTES NEGOCIAIS ACORDADOS NA CONSULTORIA (Se houver)
  if (report.ajustesRealizadosNaConversa && report.ajustesRealizadosNaConversa.length > 0) {
    checkPageBreak(25);

    doc.setFillColor(255, 251, 235); // Âmbar muito suave
    doc.setDrawColor(253, 230, 138);
    doc.setLineWidth(0.3);

    // Calcular altura do bloco de ajustes
    let totalAjustesLines = 0;
    const formattedAjustes: string[][] = [];
    report.ajustesRealizadosNaConversa.forEach((ajuste) => {
      const cleanAjuste = cleanTextForPDF(ajuste);
      const lines = doc.splitTextToSize(`•  ${cleanAjuste}`, contentWidth - 10);
      formattedAjustes.push(lines);
      totalAjustesLines += lines.length;
    });

    const ajustesBoxHeight = 8 + (totalAjustesLines * 3.7) + 3;
    checkPageBreak(ajustesBoxHeight);

    doc.roundedRect(marginLeft, yPos, contentWidth, ajustesBoxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(colorAmber[0], colorAmber[1], colorAmber[2]);
    doc.text(`DIRETRIZES & AJUSTES NEGOCIAIS DA CONSULTORIA (v${report.versaoParecer || 2}.0):`, marginLeft + 4, yPos + 5.5);

    let curAjusteY = yPos + 9.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);

    formattedAjustes.forEach((lines) => {
      doc.text(lines, marginLeft + 5, curAjusteY);
      curAjusteY += lines.length * 3.7;
    });

    yPos += ajustesBoxHeight + 5;
  }

  // =========================================================================
  // 1. SÍNTESE EXECUTIVA & DIAGNÓSTICO ESTRATÉGICO
  // =========================================================================
  drawSectionTitle('1. Síntese Executiva & Diagnóstico Estratégico');

  const cleanResumo = cleanTextForPDF(report.resumoExecutivo || 'Nenhum resumo executivo fornecido.');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  const resumoLines = doc.splitTextToSize(cleanResumo, contentWidth - 8);
  const resumoBoxHeight = resumoLines.length * 3.8 + 6;

  checkPageBreak(resumoBoxHeight);
  doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginLeft, yPos, contentWidth, resumoBoxHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text(resumoLines, marginLeft + 4, yPos + 4.5);
  yPos += resumoBoxHeight + 5;

  // =========================================================================
  // 2. CONFRONTO PROBATÓRIO COM DOCUMENTOS ANEXOS (Se houver)
  // =========================================================================
  if (
    (report.documentosCorroborativosAnalisados && report.documentosCorroborativosAnalisados.length > 0) ||
    report.cruzamentoCorroborativo
  ) {
    drawSectionTitle('2. Confronto Probatório com Documentos Anexos');

    if (report.documentosCorroborativosAnalisados && report.documentosCorroborativosAnalisados.length > 0) {
      const cleanDocs = cleanTextForPDF(report.documentosCorroborativosAnalisados.join('   |   '));
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
      const docLines = doc.splitTextToSize(`DOCUMENTOS EXAMINADOS: ${cleanDocs}`, contentWidth - 4);
      doc.text(docLines, marginLeft + 1, yPos);
      yPos += docLines.length * 3.8 + 2;
    }

    if (report.cruzamentoCorroborativo) {
      const cleanCruz = cleanTextForPDF(report.cruzamentoCorroborativo);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const cruzLines = doc.splitTextToSize(cleanCruz, contentWidth - 8);
      const cruzHeight = cruzLines.length * 3.7 + 6;

      checkPageBreak(cruzHeight);
      doc.setFillColor(240, 253, 244); // Verde suave
      doc.setDrawColor(187, 247, 208);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginLeft, yPos, contentWidth, cruzHeight, 1.5, 1.5, 'FD');

      doc.setTextColor(22, 101, 52);
      doc.text(cruzLines, marginLeft + 4, yPos + 4.5);
      yPos += cruzHeight + 5;
    }
  }

  // =========================================================================
  // 3. PRINCIPAIS RISCOS E ARMADILHAS JURÍDICAS
  // =========================================================================
  if (report.principaisRiscos && report.principaisRiscos.length > 0) {
    drawSectionTitle('3. Principais Riscos e Armadilhas Jurídicas', `${report.principaisRiscos.length} riscos`);

    report.principaisRiscos.forEach((risco, idx) => {
      const cleanRisco = cleanTextForPDF(risco);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(`${idx + 1}.  ${cleanRisco}`, contentWidth - 10);
      const itemHeight = lines.length * 3.8 + 4;

      checkPageBreak(itemHeight);
      doc.setFillColor(254, 242, 242); // Vermelho suave
      doc.setDrawColor(254, 202, 202);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginLeft, yPos, contentWidth, itemHeight, 1.5, 1.5, 'FD');

      doc.setTextColor(185, 28, 28);
      doc.text(lines, marginLeft + 5, yPos + 3.8);

      yPos += itemHeight + 2;
    });
    yPos += 3;
  }

  // =========================================================================
  // 4. EMBASAMENTO LEGAL E JURISPRUDÊNCIA APLICÁVEL
  // =========================================================================
  if (report.fundamentacaoDestaque && report.fundamentacaoDestaque.length > 0) {
    drawSectionTitle('4. Embasamento Legal e Jurisprudência Aplicável');

    report.fundamentacaoDestaque.forEach((item) => {
      const cleanNorma = cleanTextForPDF(`Dispositivo: ${item.norma}`);
      const cleanAplicacao = cleanTextForPDF(`Aplicação Prática: ${item.aplicacao}`);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const normaLines = doc.splitTextToSize(cleanNorma, contentWidth - 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      const aplicacaoLines = doc.splitTextToSize(cleanAplicacao, contentWidth - 8);

      const cardHeight = (normaLines.length * 4) + (aplicacaoLines.length * 3.7) + 6;

      checkPageBreak(cardHeight);
      doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
      doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginLeft, yPos, contentWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
      doc.text(normaLines, marginLeft + 4, yPos + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
      doc.text(aplicacaoLines, marginLeft + 4, yPos + 4.5 + (normaLines.length * 4));

      yPos += cardHeight + 2.5;
    });
    yPos += 3;
  }

  // =========================================================================
  // 5. AUDITORIA CLÁUSULA A CLÁUSULA & MINUTAS BLINDADAS
  // =========================================================================
  if (report.clausulas && report.clausulas.length > 0) {
    drawSectionTitle(
      '5. Auditoria Cláusula a Cláusula & Minutas de Redação Blindada',
      `${report.clausulas.length} cláusula(s)`
    );

    report.clausulas.forEach((clausula, index) => {
      const cRiskColor = getRiskColor(clausula.grauRisco);

      const cleanNum = cleanTextForPDF(clausula.numero || `Cláusula ${index + 1}`);
      const cleanTit = cleanTextForPDF(clausula.titulo || 'Cláusula Contratual');
      const headerTitle = `${cleanNum}: ${cleanTit}`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      const titLines = doc.splitTextToSize(headerTitle, contentWidth - 38);

      const origText = clausula.textoOriginal ? cleanTextForPDF(clausula.textoOriginal) : '';
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.6);
      const origLines = origText ? doc.splitTextToSize(origText, contentWidth - 10) : [];

      const diagText = cleanTextForPDF(clausula.diagnostico || '');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      const diagLines = diagText ? doc.splitTextToSize(diagText, contentWidth - 10) : [];

      const redacText = cleanTextForPDF(clausula.redacaoSugerida || '');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const redacLines = redacText ? doc.splitTextToSize(redacText, contentWidth - 12) : [];

      const fundText = clausula.fundamentacaoLegal ? cleanTextForPDF(clausula.fundamentacaoLegal) : '';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.4);
      const fundLines = fundText ? doc.splitTextToSize(fundText, contentWidth - 10) : [];

      // Verificar se cabe ao menos o cabeçalho da cláusula e o diagnóstico
      checkPageBreak(38);

      // Barra de cabeçalho da cláusula
      const headerBarHeight = titLines.length * 4.4 + 4;
      doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
      doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginLeft, yPos, contentWidth, headerBarHeight, 1.5, 1.5, 'FD');

      // Faixa vertical de risco à esquerda
      doc.setFillColor(cRiskColor[0], cRiskColor[1], cRiskColor[2]);
      doc.rect(marginLeft, yPos, 3, headerBarHeight, 'F');

      // Título da cláusula
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
      doc.text(titLines, marginLeft + 5, yPos + 4.2);

      // Badge de risco à direita
      const riskBadgeStr = `RISCO ${(clausula.grauRisco || 'Médio').toUpperCase()}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(cRiskColor[0], cRiskColor[1], cRiskColor[2]);
      const rw = doc.getTextWidth(riskBadgeStr);
      doc.text(riskBadgeStr, pageWidth - marginRight - rw - 3, yPos + 4.2);

      yPos += headerBarHeight + 3.5;

      // 1. Texto Original do Contrato
      if (origLines.length > 0) {
        checkPageBreak(origLines.length * 3.6 + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
        doc.text('TEXTO ORIGINAL DO CONTRATO:', marginLeft + 2, yPos);
        yPos += 3.2;

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.6);
        doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
        doc.text(origLines, marginLeft + 4, yPos);
        yPos += origLines.length * 3.6 + 2.5;
      }

      // 2. Diagnóstico Jurídico do Vício
      if (diagLines.length > 0) {
        checkPageBreak(diagLines.length * 3.7 + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(185, 28, 28);
        doc.text('DIAGNÓSTICO DO VÍCIO / ASSIMETRIA:', marginLeft + 2, yPos);
        yPos += 3.2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
        doc.text(diagLines, marginLeft + 4, yPos);
        yPos += diagLines.length * 3.7 + 2.5;
      }

      // 3. Redação Recomendada (Minuta Blindada)
      if (redacLines.length > 0) {
        const redacBoxHeight = redacLines.length * 3.8 + 8;
        checkPageBreak(redacBoxHeight + 2);

        doc.setFillColor(254, 252, 232); // Fundo âmbar suave
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(0.4);
        doc.roundedRect(marginLeft + 2, yPos, contentWidth - 4, redacBoxHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.4);
        doc.setTextColor(180, 83, 9);
        doc.text('REDAÇÃO RECOMENDADA (MINUTA BLINDADA):', marginLeft + 5, yPos + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(120, 53, 15);
        doc.text(redacLines, marginLeft + 5, yPos + 8);
        yPos += redacBoxHeight + 2.5;
      }

      // 4. Embasamento Legal da Cláusula
      if (fundLines.length > 0) {
        checkPageBreak(fundLines.length * 3.6 + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
        doc.text(fundLines, marginLeft + 2, yPos);
        yPos += fundLines.length * 3.6 + 2;
      }

      yPos += 4;
    });
  }

  // =========================================================================
  // 6. ESTRATÉGIA DE NEGOCIAÇÃO & PLANO DE AÇÃO
  // =========================================================================
  if (report.estrategiaNegociacao && report.estrategiaNegociacao.length > 0) {
    drawSectionTitle('6. Estratégia de Negociação & Plano de Ação Recomendado');

    report.estrategiaNegociacao.forEach((passo, pIndex) => {
      const cleanPasso = cleanTextForPDF(passo);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      const pLines = doc.splitTextToSize(`Passo ${pIndex + 1}: ${cleanPasso}`, contentWidth - 8);
      const pHeight = pLines.length * 3.8 + 3.5;

      checkPageBreak(pHeight);
      doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
      doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginLeft, yPos, contentWidth, pHeight, 1, 1, 'FD');

      doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
      doc.text(pLines, marginLeft + 4, yPos + 3.2);

      yPos += pHeight + 2;
    });
    yPos += 4;
  }

  // =========================================================================
  // 7. CONSULTORIA JURÍDICA COMPLEMENTAR & HISTÓRICO DE ALINHAMENTO
  // =========================================================================
  if (chatMessages && chatMessages.length > 0) {
    drawSectionTitle(
      '7. Consultoria Jurídica Complementar & Alinhamento com Agente',
      `${chatMessages.length} interação(ões)`
    );

    chatMessages.forEach((msg) => {
      const isLawyer = msg.sender === 'lawyer';
      const prefix = isLawyer ? 'ADVOGADO EMPRESARIAL SÊNIOR:' : 'USUÁRIO / CONSULTA:';
      const cleanMsgText = cleanTextForPDF(msg.text);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      const msgLines = doc.splitTextToSize(cleanMsgText, contentWidth - 10);
      const cardHeight = msgLines.length * 3.7 + 8;

      checkPageBreak(cardHeight);

      if (isLawyer) {
        doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
        doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
      } else {
        doc.setFillColor(254, 243, 199); // Âmbar claro para o usuário
        doc.setDrawColor(252, 211, 77);
      }
      doc.setLineWidth(0.3);
      doc.roundedRect(marginLeft, yPos, contentWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.3);
      doc.setTextColor(
        isLawyer ? colorAmber[0] : colorNavy[0],
        isLawyer ? colorAmber[1] : colorNavy[1],
        isLawyer ? colorAmber[2] : colorNavy[2]
      );
      doc.text(prefix, marginLeft + 4, yPos + 4);

      if (msg.timestamp) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
        const cleanTime = cleanTextForPDF(msg.timestamp);
        const timeWidth = doc.getTextWidth(cleanTime);
        doc.text(cleanTime, pageWidth - marginRight - timeWidth - 4, yPos + 4);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
      doc.text(msgLines, marginLeft + 4, yPos + 7.5);

      yPos += cardHeight + 2.5;
    });
    yPos += 4;
  }

  // =========================================================================
  // 8. TERMO DE VALIDAÇÃO, CHANCELA E APROVAÇÃO DO ADVOGADO
  // =========================================================================
  checkPageBreak(52); // Garante que o termo e as assinaturas nunca fiquem cortados
  yPos += 2;

  doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
  doc.setDrawColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.setLineWidth(0.7);
  doc.roundedRect(marginLeft, yPos, contentWidth, 50, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text('8. TERMO DE VALIDAÇÃO E APROVAÇÃO DO ADVOGADO RESPONSÁVEL', marginLeft + 5, yPos + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text(
    'Declaro que examinei as análises, diagnósticos de vulnerabilidades e minutas blindadas sugeridas neste parecer técnico-jurídico corporativo:',
    marginLeft + 5,
    yPos + 10
  );

  // Checkboxes de Decisão
  const drawCheckbox = (x: number, y: number, label: string) => {
    doc.setDrawColor(colorNavy[0], colorNavy[1], colorNavy[2]);
    doc.setLineWidth(0.4);
    doc.rect(x, y - 2.6, 3, 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
    doc.text(label, x + 5, y);
  };

  drawCheckbox(marginLeft + 6, yPos + 16.5, '[  ] APROVADO INTEGRALMENTE (Minuta apta para assinatura sem alterações)');
  drawCheckbox(marginLeft + 6, yPos + 21, '[  ] APROVADO COM RESSALVAS (Aprovado condicionado à adoção das Minutas Blindadas)');
  drawCheckbox(marginLeft + 6, yPos + 25.5, '[  ] REJEITADO / DEVOLVIDO (Risco crítico incompatível. Exige renegociação integral)');

  // Linhas de Assinatura e Dados
  yPos += 33;
  doc.setDrawColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
  doc.setLineWidth(0.3);

  // Assinatura do Advogado
  doc.line(marginLeft + 8, yPos + 7, marginLeft + 75, yPos + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text('Assinatura do Advogado Responsável', marginLeft + 8, yPos + 10.5);

  // OAB e Data
  doc.line(marginLeft + 90, yPos + 7, marginLeft + 130, yPos + 7);
  doc.text('Inscrição na OAB / UF', marginLeft + 90, yPos + 10.5);

  doc.line(marginLeft + 140, yPos + 7, marginLeft + 172, yPos + 7);
  doc.text('Data do Visto', marginLeft + 140, yPos + 10.5);

  // =========================================================================
  // CABEÇALHOS CONTÍNUOS E RODAPÉS PADRONIZADOS EM TODAS AS PÁGINAS
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Cabeçalho institucional contínuo (Páginas 2 em diante)
    if (i > 1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
      doc.text('LEGALOPS BRASIL • PARECER TÉCNICO-JURÍDICO CORPORATIVO', marginLeft, 10);

      const pTitle = cleanTextForPDF(report.titulo || 'Auditoria Contratual').slice(0, 48);
      const ptWidth = doc.getTextWidth(pTitle);
      doc.text(pTitle, pageWidth - marginRight - ptWidth, 10);

      doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, 12.5, pageWidth - marginRight, 12.5);
    }

    // Rodapé em todas as páginas
    doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
    doc.text(
      'Documento corporativo confidencial emitido para fins de blindagem e estratégia jurídica.',
      marginLeft,
      pageHeight - 7.5
    );

    const pageStr = `Página ${i} de ${totalPages}`;
    const pageStrWidth = doc.getTextWidth(pageStr);
    doc.setFont('helvetica', 'bold');
    doc.text(pageStr, pageWidth - marginRight - pageStrWidth, pageHeight - 7.5);
  }

  // Nome do arquivo gerado
  const cleanDocTitle = cleanTextForPDF(report.titulo || 'Parecer_Juridico')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 30);
  const fileName = `Parecer_Juridico_${cleanDocTitle}_v${report.versaoParecer || 1}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // Download direto do arquivo PDF
  doc.save(fileName);
}
