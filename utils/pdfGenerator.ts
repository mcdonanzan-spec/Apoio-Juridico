import { jsPDF } from 'jspdf';
import { StructuredAnalysisResult, ChatMessage } from '../types';

/**
 * Utilitário profissional de geração de parecer jurídico em formato PDF vetorial.
 * Utiliza o motor jsPDF direto no documento para garantir:
 * 1. Zero páginas em branco (não depende de limitações de memória de canvas HTML5).
 * 2. Texto 100% selecionável, pesquisável e nítido em qualquer zoom ou impressora.
 * 3. Paginação automática inteligente com cabeçalhos e rodapés oficiais "Página X de Y".
 * 4. Inclusão completa de todas as abas: Diagnóstico, Provas, Auditoria de Cláusulas com
 *    Minutas Blindadas, Histórico da Consultoria Interativa e Termo de Aprovação do Advogado.
 */

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

  // Helper para quebra de página
  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      yPos = marginTop + 4;
      return true;
    }
    return false;
  };

  // Cores corporativas
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
        return [234, 88, 12] as const; // Laranja forte
      case 'Médio':
        return [217, 119, 6] as const; // Âmbar
      default:
        return [16, 185, 129] as const; // Verde
    }
  };

  // Helper para títulos de seção
  const drawSectionTitle = (title: string, badge?: string) => {
    checkPageBreak(16);
    yPos += 3;

    doc.setFillColor(colorNavy[0], colorNavy[1], colorNavy[2]);
    doc.rect(marginLeft, yPos, 3.5, 9.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
    doc.text(title.toUpperCase(), marginLeft + 6, yPos + 6.5);

    if (badge) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
      const badgeWidth = doc.getTextWidth(badge);
      doc.text(badge, pageWidth - marginRight - badgeWidth, yPos + 6.5);
    }

    yPos += 12;
  };

  // ==========================================
  // PÁGINA 1: CABEÇALHO TIMBRADO E PAINEL EXECUTIVO
  // ==========================================

  // Faixa superior institucional
  doc.setFillColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Topo do Cabeçalho
  yPos = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text('LEGALOPS BRASIL', marginLeft, yPos);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colorAmber[0], colorAmber[1], colorAmber[2]);
  doc.text('ADVOCACIA EMPRESARIAL CORPORATIVA', marginLeft + 54, yPos);

  // Metadados no canto superior direito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  const versaoStr = `PARECER TÉCNICO-JURÍDICO (v${report.versaoParecer || 1}.0)`;
  const versaoWidth = doc.getTextWidth(versaoStr);
  doc.text(versaoStr, pageWidth - marginRight - versaoWidth, yPos);

  yPos += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
  doc.text('Consultoria Estratégica, Auditoria Contratual e Blindagem de Riscos', marginLeft, yPos);

  const dataStr = `Emissão: ${new Date().toLocaleDateString('pt-BR')} • DOC-${Math.floor(100000 + Math.random() * 900000)}`;
  const dataWidth = doc.getTextWidth(dataStr);
  doc.text(dataStr, pageWidth - marginRight - dataWidth, yPos);

  // Linha divisória do cabeçalho
  yPos += 5;
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);

  // NOTA DE GOVERNANÇA
  yPos += 5;
  const notaText =
    'NOTA DE GOVERNANÇA & VALIDAÇÃO PROFISSIONAL: Este parecer constitui instrumento de apoio técnico-jurídico corporativo especializado. Suas recomendações, auditoria de vícios e minutas blindadas foram calibradas sob as normas civis e empresariais brasileiras e devem ser formalmente chanceladas pelo advogado responsável antes da subscrição definitiva.';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  const notaLines = doc.splitTextToSize(notaText, contentWidth - 8);
  const notaHeight = notaLines.length * 3.5 + 5;

  doc.setFillColor(254, 252, 232); // Amarelo suave
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(marginLeft, yPos, contentWidth, notaHeight, 2, 2, 'FD');

  doc.setTextColor(146, 64, 14);
  doc.text(notaLines, marginLeft + 4, yPos + 4);
  yPos += notaHeight + 5;

  // PAINEL DE RISCO & IDENTIFICAÇÃO DO CONTRATO
  const titleLines = doc.splitTextToSize(report.titulo || 'Parecer de Auditoria Contratual', contentWidth - 55);
  const panelHeight = Math.max(26, titleLines.length * 5 + 16);

  doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.roundedRect(marginLeft, yPos, contentWidth, panelHeight, 2.5, 2.5, 'FD');

  // Título e Objeto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text(titleLines, marginLeft + 5, yPos + 6);

  const subY = yPos + titleLines.length * 5 + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text(`Partes & Objeto: ${report.partesIdentificadas || 'Instrumento Contratual Corporativo'}`, marginLeft + 5, subY);

  // Badge do Score no canto do painel
  const riskBoxX = pageWidth - marginRight - 46;
  const riskColor = getRiskColor(report.classificacaoRisco);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(riskBoxX, yPos + 3.5, 42, panelHeight - 7, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
  doc.text('ÍNDICE DE EXPOSIÇÃO', riskBoxX + 21, yPos + 8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text(`${report.scoreRisco || 50}/100`, riskBoxX + 21, yPos + 14, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(`RISCO ${(report.classificacaoRisco || 'Médio').toUpperCase()}`, riskBoxX + 21, yPos + 19, {
    align: 'center',
  });

  yPos += panelHeight + 6;

  // AJUSTES INCORPORADOS NA CONSULTORIA INTERATIVA (Se houver)
  if (report.ajustesRealizadosNaConversa && report.ajustesRealizadosNaConversa.length > 0) {
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(colorAmber[0], colorAmber[1], colorAmber[2]);
    doc.text(`DIRETRIZES & AJUSTES NEGOCIAIS ACORDADOS NA CONSULTORIA (v${report.versaoParecer || 2}.0):`, marginLeft, yPos);
    yPos += 4.5;

    report.ajustesRealizadosNaConversa.forEach((ajuste) => {
      const lines = doc.splitTextToSize(`• ${ajuste}`, contentWidth - 4);
      checkPageBreak(lines.length * 4 + 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
      doc.text(lines, marginLeft + 2, yPos);
      yPos += lines.length * 4 + 1.5;
    });
    yPos += 3;
  }

  // ==========================================
  // 1. SÍNTESE EXECUTIVA & DIAGNÓSTICO
  // ==========================================
  drawSectionTitle('1. Síntese Executiva & Diagnóstico Estratégico');

  const resumoLines = doc.splitTextToSize(report.resumoExecutivo || 'Nenhum resumo executivo fornecido.', contentWidth - 8);
  const resumoBoxHeight = resumoLines.length * 4 + 7;

  checkPageBreak(resumoBoxHeight);
  doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginLeft, yPos, contentWidth, resumoBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text(resumoLines, marginLeft + 4, yPos + 5);
  yPos += resumoBoxHeight + 6;

  // ==========================================
  // 2. CONFRONTO PROBATÓRIO (Se houver)
  // ==========================================
  if (
    (report.documentosCorroborativosAnalisados && report.documentosCorroborativosAnalisados.length > 0) ||
    report.cruzamentoCorroborativo
  ) {
    drawSectionTitle('2. Confronto Probatório com Documentos Anexos');

    if (report.documentosCorroborativosAnalisados && report.documentosCorroborativosAnalisados.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
      doc.text(
        `DOCUMENTOS ANALISADOS EM CONJUNTO: ${report.documentosCorroborativosAnalisados.join('  |  ')}`,
        marginLeft,
        yPos
      );
      yPos += 5;
    }

    if (report.cruzamentoCorroborativo) {
      const cruzLines = doc.splitTextToSize(report.cruzamentoCorroborativo, contentWidth - 8);
      const cruzHeight = cruzLines.length * 4 + 7;
      checkPageBreak(cruzHeight);

      doc.setFillColor(240, 253, 244); // Verde suave
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(marginLeft, yPos, contentWidth, cruzHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52);
      doc.text(cruzLines, marginLeft + 4, yPos + 5);
      yPos += cruzHeight + 6;
    }
  }

  // ==========================================
  // 3. PRINCIPAIS RISCOS E ARMADILHAS
  // ==========================================
  if (report.principaisRiscos && report.principaisRiscos.length > 0) {
    drawSectionTitle('3. Principais Riscos e Armadilhas Jurídicas', `${report.principaisRiscos.length} riscos mapeados`);

    report.principaisRiscos.forEach((risco, idx) => {
      const lines = doc.splitTextToSize(`${idx + 1}.  ${risco}`, contentWidth - 10);
      const itemHeight = lines.length * 4 + 4;
      checkPageBreak(itemHeight);

      doc.setFillColor(254, 242, 242); // Vermelho bem suave
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(marginLeft, yPos, contentWidth, itemHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(185, 28, 28);
      doc.text(lines, marginLeft + 5, yPos + 4);

      yPos += itemHeight + 2.5;
    });
    yPos += 3;
  }

  // ==========================================
  // 4. EMBASAMENTO LEGAL E JURISPRUDÊNCIA
  // ==========================================
  if (report.fundamentacaoDestaque && report.fundamentacaoDestaque.length > 0) {
    drawSectionTitle('4. Embasamento Legal e Jurisprudência Aplicável');

    report.fundamentacaoDestaque.forEach((item) => {
      const normaLines = doc.splitTextToSize(`Dispositivo: ${item.norma}`, contentWidth - 8);
      const aplicacaoLines = doc.splitTextToSize(`Aplicação Prática: ${item.aplicacao}`, contentWidth - 8);
      const cardHeight = (normaLines.length + aplicacaoLines.length) * 4 + 8;

      checkPageBreak(cardHeight);

      doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
      doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
      doc.roundedRect(marginLeft, yPos, contentWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
      doc.text(normaLines, marginLeft + 4, yPos + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
      doc.text(aplicacaoLines, marginLeft + 4, yPos + 4.5 + normaLines.length * 4);

      yPos += cardHeight + 3;
    });
    yPos += 3;
  }

  // ==========================================
  // 5. AUDITORIA CLÁUSULA A CLÁUSULA & MINUTAS BLINDADAS
  // ==========================================
  if (report.clausulas && report.clausulas.length > 0) {
    drawSectionTitle(
      '5. Auditoria Cláusula a Cláusula & Minutas de Redação Blindada',
      `${report.clausulas.length} cláusula(s) auditada(s)`
    );

    report.clausulas.forEach((clausula, index) => {
      // Estimar altura total da cláusula para avaliar quebra de página
      const titLines = doc.splitTextToSize(
        `${clausula.numero || `Cláusula ${index + 1}`}: ${clausula.titulo || 'Cláusula Contratual'}`,
        contentWidth - 35
      );
      const origLines = clausula.textoOriginal ? doc.splitTextToSize(clausula.textoOriginal, contentWidth - 10) : [];
      const diagLines = doc.splitTextToSize(clausula.diagnostico || '', contentWidth - 10);
      const redacLines = doc.splitTextToSize(clausula.redacaoSugerida || '', contentWidth - 10);
      const fundLines = clausula.fundamentacaoLegal ? doc.splitTextToSize(clausula.fundamentacaoLegal, contentWidth - 10) : [];

      const totalEstimatedHeight =
        10 +
        titLines.length * 4.5 +
        (origLines.length > 0 ? origLines.length * 3.8 + 8 : 0) +
        (diagLines.length > 0 ? diagLines.length * 3.8 + 8 : 0) +
        (redacLines.length > 0 ? redacLines.length * 3.8 + 8 : 0) +
        (fundLines.length > 0 ? fundLines.length * 3.8 + 7 : 0) +
        6;

      // Se não couber pelo menos o cabeçalho e diagnóstico, quebra de página antes de começar
      checkPageBreak(Math.min(totalEstimatedHeight, 55));

      const startY = yPos;
      const cRiskColor = getRiskColor(clausula.grauRisco);

      // Barra de cabeçalho da cláusula
      doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
      doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(marginLeft, yPos, contentWidth, titLines.length * 4.5 + 5, 1.5, 1.5, 'FD');

      // Linha de destaque do risco à esquerda
      doc.setFillColor(cRiskColor[0], cRiskColor[1], cRiskColor[2]);
      doc.rect(marginLeft, yPos, 3, titLines.length * 4.5 + 5, 'F');

      // Título da Cláusula
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
      doc.text(titLines, marginLeft + 5, yPos + 4.5);

      // Badge de Risco no topo direito
      const riskText = `RISCO ${(clausula.grauRisco || 'Médio').toUpperCase()}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(cRiskColor[0], cRiskColor[1], cRiskColor[2]);
      const rw = doc.getTextWidth(riskText);
      doc.text(riskText, pageWidth - marginRight - rw - 3, yPos + 4.5);

      yPos += titLines.length * 4.5 + 7;

      // 1. TEXTO ORIGINAL DO CONTRATO
      if (origLines.length > 0) {
        checkPageBreak(origLines.length * 3.8 + 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
        doc.text('TEXTO ORIGINAL DO CONTRATO:', marginLeft + 2, yPos);
        yPos += 3.5;

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
        doc.text(origLines, marginLeft + 4, yPos);
        yPos += origLines.length * 3.8 + 2;
      }

      // 2. DIAGNÓSTICO JURÍDICO DO VÍCIO
      if (diagLines.length > 0) {
        checkPageBreak(diagLines.length * 3.8 + 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(185, 28, 28);
        doc.text('DIAGNÓSTICO DO VÍCIO / ASSIMETRIA:', marginLeft + 2, yPos);
        yPos += 3.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
        doc.text(diagLines, marginLeft + 4, yPos);
        yPos += diagLines.length * 3.8 + 2;
      }

      // 3. REDAÇÃO RECOMENDADA (MINUTA BLINDADA)
      if (redacLines.length > 0) {
        const redacBoxHeight = redacLines.length * 3.8 + 8;
        checkPageBreak(redacBoxHeight + 2);

        doc.setFillColor(254, 252, 232); // Fundo âmbar suave
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(0.4);
        doc.roundedRect(marginLeft + 2, yPos, contentWidth - 4, redacBoxHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(180, 83, 9);
        doc.text('REDAÇÃO RECOMENDADA (MINUTA BLINDADA):', marginLeft + 5, yPos + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 53, 15);
        doc.text(redacLines, marginLeft + 5, yPos + 8);
        yPos += redacBoxHeight + 3;
      }

      // 4. EMBASAMENTO LEGAL DA CLÁUSULA
      if (fundLines.length > 0) {
        checkPageBreak(fundLines.length * 3.8 + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
        doc.text(fundLines, marginLeft + 2, yPos);
        yPos += fundLines.length * 3.8 + 2;
      }

      yPos += 5;
    });
  }

  // ==========================================
  // 6. ESTRATÉGIA NEGOCIAL E PLANO DE AÇÃO
  // ==========================================
  if (report.estrategiaNegociacao && report.estrategiaNegociacao.length > 0) {
    drawSectionTitle('6. Estratégia de Negociação & Plano de Ação Recomendado');

    report.estrategiaNegociacao.forEach((passo, pIndex) => {
      const pLines = doc.splitTextToSize(`Passo ${pIndex + 1}: ${passo}`, contentWidth - 8);
      const pHeight = pLines.length * 4 + 4;
      checkPageBreak(pHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
      doc.text(pLines, marginLeft + 4, yPos + 3);

      yPos += pHeight + 1.5;
    });
    yPos += 4;
  }

  // ==========================================
  // 7. HISTÓRICO DA CONSULTORIA INTERATIVA
  // ==========================================
  if (chatMessages && chatMessages.length > 0) {
    drawSectionTitle(
      '7. Consultoria Jurídica Complementar & Alinhamento com Agente',
      `${chatMessages.length} mensagem(ns) registrada(s)`
    );

    chatMessages.forEach((msg) => {
      const isLawyer = msg.sender === 'lawyer';
      const prefix = isLawyer ? 'ADVOGADO EMPRESARIAL SÊNIOR:' : 'USUÁRIO / CONSULTA:';
      const msgLines = doc.splitTextToSize(msg.text, contentWidth - 12);
      const cardHeight = msgLines.length * 3.8 + 9;

      checkPageBreak(cardHeight);

      if (isLawyer) {
        doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
        doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
      } else {
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(252, 211, 77);
      }

      doc.roundedRect(marginLeft, yPos, contentWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(isLawyer ? colorAmber[0] : colorNavy[0], isLawyer ? colorAmber[1] : colorNavy[1], isLawyer ? colorAmber[2] : colorNavy[2]);
      doc.text(prefix, marginLeft + 4, yPos + 4);

      if (msg.timestamp) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
        const timeWidth = doc.getTextWidth(msg.timestamp);
        doc.text(msg.timestamp, pageWidth - marginRight - timeWidth - 4, yPos + 4);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
      doc.text(msgLines, marginLeft + 4, yPos + 8);

      yPos += cardHeight + 2.5;
    });
    yPos += 4;
  }

  // ==========================================
  // 8. PARECER FORMAL TEXTUAL (Se presente)
  // ==========================================
  if (report.relatorioMarkdownCompleto && report.relatorioMarkdownCompleto.trim().length > 100) {
    drawSectionTitle('8. Parecer Jurídico Formal Consolidado');

    // Limpar marcações markdown pesadas para texto limpo e legível
    const cleanFormalText = report.relatorioMarkdownCompleto
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1');

    const formalLines = doc.splitTextToSize(cleanFormalText, contentWidth - 8);

    // Escrever em blocos respeitando quebras de página
    let lineIdx = 0;
    while (lineIdx < formalLines.length) {
      checkPageBreak(12);
      const remainingLinesOnPage = Math.floor((pageHeight - marginBottom - yPos) / 3.8);
      const linesToDraw = formalLines.slice(lineIdx, lineIdx + remainingLinesOnPage);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
      doc.text(linesToDraw, marginLeft + 4, yPos);

      yPos += linesToDraw.length * 3.8;
      lineIdx += linesToDraw.length;
    }
    yPos += 5;
  }

  // ==========================================
  // 9. TERMO DE VALIDAÇÃO E CHANCELA DO ADVOGADO
  // ==========================================
  checkPageBreak(58);
  yPos += 3;

  doc.setFillColor(colorBgGray[0], colorBgGray[1], colorBgGray[2]);
  doc.setDrawColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(marginLeft, yPos, contentWidth, 54, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text('9. TERMO DE VALIDAÇÃO E APROVAÇÃO DO ADVOGADO RESPONSÁVEL', marginLeft + 5, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text(
    'Declaro que examinei as análises, diagnósticos de vulnerabilidades e minutas blindadas sugeridas neste parecer técnico-jurídico corporativo:',
    marginLeft + 5,
    yPos + 11
  );

  // Checkboxes de Decisão
  const drawCheckbox = (x: number, y: number, label: string) => {
    doc.setDrawColor(colorNavy[0], colorNavy[1], colorNavy[2]);
    doc.setLineWidth(0.4);
    doc.rect(x, y - 2.8, 3.2, 3.2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
    doc.text(label, x + 5, y);
  };

  drawCheckbox(marginLeft + 6, yPos + 18, '[  ] APROVADO INTEGRALMENTE (Minuta apta para assinatura sem alterações)');
  drawCheckbox(marginLeft + 6, yPos + 23, '[  ] APROVADO COM RESSALVAS (Aprovado condicionado à adoção das Minutas Blindadas)');
  drawCheckbox(marginLeft + 6, yPos + 28, '[  ] REJEITADO / DEVOLVIDO (Risco crítico incompatível. Exige renegociação integral)');

  // Linhas de Assinatura e Dados
  yPos += 36;
  doc.setDrawColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
  doc.setLineWidth(0.3);

  // Assinatura do Advogado
  doc.line(marginLeft + 8, yPos + 8, marginLeft + 80, yPos + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colorNavy[0], colorNavy[1], colorNavy[2]);
  doc.text('Assinatura do Advogado Responsável', marginLeft + 8, yPos + 12);

  // OAB e Data
  doc.line(marginLeft + 95, yPos + 8, marginLeft + 135, yPos + 8);
  doc.text('Inscrição na OAB / UF', marginLeft + 95, yPos + 12);

  doc.line(marginLeft + 145, yPos + 8, marginLeft + 175, yPos + 8);
  doc.text('Data do Visto', marginLeft + 145, yPos + 12);

  // ==========================================
  // RODAPÉ E CABEÇALHO CONTÍNUO EM TODAS AS PÁGINAS
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Cabeçalho contínuo a partir da página 2
    if (i > 1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(colorLightSlate[0], colorLightSlate[1], colorLightSlate[2]);
      doc.text('LEGALOPS BRASIL • PARECER TÉCNICO-JURÍDICO CORPORATIVO', marginLeft, 10);

      const pTitle = (report.titulo || 'Auditoria Contratual').slice(0, 45);
      const ptWidth = doc.getTextWidth(pTitle);
      doc.text(pTitle, pageWidth - marginRight - ptWidth, 10);

      doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, 12, pageWidth - marginRight, 12);
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
      pageHeight - 8
    );

    const pageStr = `Página ${i} de ${totalPages}`;
    const pageStrWidth = doc.getTextWidth(pageStr);
    doc.setFont('helvetica', 'bold');
    doc.text(pageStr, pageWidth - marginRight - pageStrWidth, pageHeight - 8);
  }

  // Nome limpo do arquivo
  const cleanTitle = (report.titulo || 'Parecer_Juridico')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 30);
  const fileName = `Parecer_Juridico_${cleanTitle}_v${report.versaoParecer || 1}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // Salvar diretamente o arquivo PDF vetorial
  doc.save(fileName);
}
