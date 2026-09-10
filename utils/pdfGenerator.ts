import { StructuredAnalysisResult, ChatMessage } from '../types';

/**
 * Utilitário de Geração e Exportação de PDF para o Parecer Jurídico Corporativo.
 * Utiliza estilização inline padronizada em Hexadecimal (#hex) para garantir
 * compatibilidade total com o html2canvas e jsPDF, evitando problemas de texto
 * transparente ou páginas em branco causados por sintaxes modernas de cores do Tailwind.
 */

function escapeHtml(text?: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildReportPrintableHtml(
  report: StructuredAnalysisResult,
  chatMessages: ChatMessage[] = []
): string {
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const versao = report.versaoParecer || 1;
  const docCode = 'DOC-' + Date.now().toString().slice(-6);

  // Determinar cor do score
  let scoreColor = '#15803d'; // verde
  let scoreBg = '#f0fdf4';
  let scoreBorder = '#bbf7d0';
  if (report.scoreRisco > 30 && report.scoreRisco <= 60) {
    scoreColor = '#b45309'; // âmbar
    scoreBg = '#fffbeb';
    scoreBorder = '#fde68a';
  } else if (report.scoreRisco > 60 && report.scoreRisco <= 80) {
    scoreColor = '#c2410c'; // laranja
    scoreBg = '#fff7ed';
    scoreBorder = '#fed7aa';
  } else if (report.scoreRisco > 80) {
    scoreColor = '#b91c1c'; // vermelho
    scoreBg = '#fef2f2';
    scoreBorder = '#fecaca';
  }

  // Cláusulas HTML
  let clausulasHtml = '';
  if (report.clausulas && report.clausulas.length > 0) {
    clausulasHtml = report.clausulas
      .map((c, i) => {
        let riscoTagBg = '#f1f5f9';
        let riscoTagColor = '#334155';
        if (c.grauRisco === 'Crítico') {
          riscoTagBg = '#fee2e2';
          riscoTagColor = '#991b1b';
        } else if (c.grauRisco === 'Alto') {
          riscoTagBg = '#ffedd5';
          riscoTagColor = '#9a3412';
        } else if (c.grauRisco === 'Médio') {
          riscoTagBg = '#fef3c7';
          riscoTagColor = '#92400e';
        } else if (c.grauRisco === 'Baixo') {
          riscoTagBg = '#dcfce7';
          riscoTagColor = '#166534';
        }

        return `
        <div style="page-break-inside: avoid; break-inside: avoid; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-bottom: 14px; background-color: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
            <div style="font-size: 13px; font-weight: bold; color: #0f172a;">
              ${escapeHtml(c.numero)} — ${escapeHtml(c.titulo)}
            </div>
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; background-color: ${riscoTagBg}; color: ${riscoTagColor}; border: 1px solid #cbd5e1;">
              Risco ${escapeHtml(c.grauRisco)}
            </span>
          </div>

          ${
            c.textoOriginal
              ? `
          <div style="padding: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; color: #334155; font-style: italic; margin-bottom: 10px; line-height: 1.5;">
            <strong style="font-style: normal; display: block; font-size: 10px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
              Redação Original Identificada no Contrato:
            </strong>
            "${escapeHtml(c.textoOriginal)}"
          </div>`
              : ''
          }

          <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <div style="flex: 1; padding: 10px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px;">
              <strong style="display: block; font-size: 10px; text-transform: uppercase; color: #991b1b; margin-bottom: 4px;">
                Diagnóstico do Risco Jurídico:
              </strong>
              <div style="font-size: 11px; color: #1e293b; line-height: 1.4;">
                ${escapeHtml(c.diagnostico)}
              </div>
            </div>
            <div style="flex: 1; padding: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
              <strong style="display: block; font-size: 10px; text-transform: uppercase; color: #334155; margin-bottom: 4px;">
                Fundamentação Legal (Código Civil / STJ):
              </strong>
              <div style="font-size: 11px; color: #1e293b; line-height: 1.4;">
                ${escapeHtml(c.fundamentacaoLegal)}
              </div>
            </div>
          </div>

          ${
            c.redacaoSugerida
              ? `
          <div style="padding: 12px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;">
            <strong style="display: block; font-size: 10px; text-transform: uppercase; color: #065f46; margin-bottom: 4px;">
              Minuta de Redação Blindada Recomendada (Contraproposta):
            </strong>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #0f172a; line-height: 1.5; background-color: #ffffff; padding: 10px; border-radius: 4px; border: 1px solid #a7f3d0; white-space: pre-wrap;">
${escapeHtml(c.redacaoSugerida)}
            </div>
          </div>`
              : ''
          }
        </div>`;
      })
      .join('');
  }

  // Deliberações da Conversa
  let ajustesConversaHtml = '';
  if (report.ajustesRealizadosNaConversa && report.ajustesRealizadosNaConversa.length > 0) {
    ajustesConversaHtml = `
    <div style="page-break-inside: avoid; break-inside: avoid; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
      <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #78350f; margin: 0 0 8px 0;">
        Decisões & Ajustes Incorporados na Consultoria Interativa (v${versao}.0)
      </h3>
      <div style="padding: 10px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;">
        ${report.ajustesRealizadosNaConversa
          .map(
            (ajuste) => `
          <div style="font-size: 11px; color: #78350f; font-weight: 500; margin-bottom: 4px; line-height: 1.4;">
            • ${escapeHtml(ajuste)}
          </div>`
          )
          .join('')}
      </div>
    </div>`;
  }

  // Riscos Críticos
  let riscosHtml = '';
  if (report.principaisRiscos && report.principaisRiscos.length > 0) {
    riscosHtml = `
    <div style="page-break-inside: avoid; break-inside: avoid; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
      <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #991b1b; margin: 0 0 8px 0;">
        3. Principais Armadilhas & Riscos Jurídicos Mapeados
      </h3>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${report.principaisRiscos
          .map(
            (r, idx) => `
          <div style="display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px;">
            <span style="display: inline-block; width: 18px; height: 18px; line-height: 18px; text-align: center; border-radius: 50%; background-color: #dc2626; color: #ffffff; font-size: 10px; font-weight: bold; flex-shrink: 0;">
              ${idx + 1}
            </span>
            <span style="font-size: 11px; color: #1e293b; font-weight: 500; line-height: 1.4;">
              ${escapeHtml(r)}
            </span>
          </div>`
          )
          .join('')}
      </div>
    </div>`;
  }

  // Documentos Corroborativos
  let corroborativoHtml = '';
  if (report.cruzamentoCorroborativo || (report.documentosCorroborativosAnalisados && report.documentosCorroborativosAnalisados.length > 0)) {
    corroborativoHtml = `
    <div style="page-break-inside: avoid; break-inside: avoid; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
      <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #3730a3; margin: 0 0 8px 0;">
        2. Confronto Probatório com Documentos Corroborativos
      </h3>
      ${
        report.documentosCorroborativosAnalisados && report.documentosCorroborativosAnalisados.length > 0
          ? `
      <div style="margin-bottom: 8px;">
        <span style="font-size: 10px; font-weight: bold; color: #475569; display: block; margin-bottom: 4px;">
          Evidências e Documentos Cruzados (${report.documentosCorroborativosAnalisados.length}):
        </span>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${report.documentosCorroborativosAnalisados
            .map(
              (doc) => `
            <span style="font-size: 10px; background-color: #e0e7ff; color: #312e81; padding: 2px 8px; border-radius: 4px; border: 1px solid #c7d2fe; font-weight: 500;">
              ${escapeHtml(doc)}
            </span>`
            )
            .join('')}
        </div>
      </div>`
          : ''
      }
      ${
        report.cruzamentoCorroborativo
          ? `
      <div style="padding: 10px; background-color: #eef2ff; border: 1px solid #e0e7ff; border-radius: 6px; font-size: 11px; color: #1e1b4b; line-height: 1.5;">
        ${escapeHtml(report.cruzamentoCorroborativo)}
      </div>`
          : ''
      }
    </div>`;
  }

  // Embasamento Legal
  let fundamentacaoHtml = '';
  if (report.fundamentacaoDestaque && report.fundamentacaoDestaque.length > 0) {
    fundamentacaoHtml = `
    <div style="page-break-inside: avoid; break-inside: avoid; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
      <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0 0 8px 0;">
        4. Embasamento na Legislação e Jurisprudência Brasileira
      </h3>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${report.fundamentacaoDestaque
          .map(
            (item) => `
          <div style="flex: 1 1 calc(50% - 10px); min-width: 280px; padding: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; box-sizing: border-box;">
            <strong style="display: block; font-size: 11px; color: #0f172a; margin-bottom: 4px;">
              ${escapeHtml(item.norma)}
            </strong>
            <div style="font-size: 10px; color: #334155; line-height: 1.4;">
              ${escapeHtml(item.aplicacao)}
            </div>
          </div>`
          )
          .join('')}
      </div>
    </div>`;
  }

  // Estratégia de Negociação
  let estrategiaHtml = '';
  if (report.estrategiaNegocial && report.estrategiaNegocial.length > 0) {
    estrategiaHtml = `
    <div style="page-break-inside: avoid; break-inside: avoid; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
      <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0 0 8px 0;">
        6. Estratégia de Negociação & Plano de Ação Recomendado
      </h3>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${report.estrategiaNegocial
          .map(
            (passo, idx) => `
          <div style="display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
            <span style="display: inline-block; width: 18px; height: 18px; line-height: 18px; text-align: center; border-radius: 50%; background-color: #0f172a; color: #fbbf24; font-size: 10px; font-weight: bold; flex-shrink: 0;">
              ${idx + 1}
            </span>
            <span style="font-size: 11px; color: #1e293b; font-weight: 500; line-height: 1.4;">
              ${escapeHtml(passo)}
            </span>
          </div>`
          )
          .join('')}
      </div>
    </div>`;
  }

  // Histórico de Chat da Consultoria
  let chatConsultoriaHtml = '';
  if (chatMessages && chatMessages.length > 0) {
    chatConsultoriaHtml = `
    <div style="page-break-inside: avoid; break-inside: avoid; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
      <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0 0 8px 0;">
        7. Consultoria Jurídica Complementar & Histórico de Alinhamentos
      </h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${chatMessages
          .map((msg) => {
            const isUser = msg.sender === 'user';
            return `
          <div style="padding: 10px; border-radius: 6px; border: 1px solid ${isUser ? '#cbd5e1' : '#fde68a'}; background-color: ${isUser ? '#f1f5f9' : '#fffbeb'}; font-size: 11px; line-height: 1.4;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: ${isUser ? '#334155' : '#92400e'};">
              <span>${isUser ? 'Instrução do Solicitante:' : 'Parecer do Advogado Sênior:'}</span>
              <span style="font-weight: normal; color: #94a3b8;">${escapeHtml(msg.timestamp)}</span>
            </div>
            <div style="color: #0f172a; white-space: pre-wrap;">
              ${escapeHtml(msg.text)}
            </div>
          </div>`;
          })
          .join('')}
      </div>
    </div>`;
  }

  // Parecer Textual Completo
  let parecerTextoHtml = '';
  if (report.relatorioMarkdownCompleto) {
    parecerTextoHtml = `
    <div style="page-break-inside: avoid; break-inside: avoid; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
      <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0 0 8px 0;">
        8. Parecer Jurídico Formal Consolidado
      </h3>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #1e293b; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; white-space: pre-wrap; line-height: 1.5;">
${escapeHtml(report.relatorioMarkdownCompleto)}
      </div>
    </div>`;
  }

  return `
  <div style="width: 740px; margin: 0 auto; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background-color: #ffffff; padding: 10px; box-sizing: border-box;">
    <!-- CABEÇALHO OFICIAL TIMBRADO -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a;">
            LEGALOPS BRASIL
          </span>
          <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; background-color: #0f172a; color: #ffffff; padding: 2px 6px; border-radius: 3px;">
            Advocacia Empresarial
          </span>
        </div>
        <div style="font-size: 10px; color: #475569; font-weight: 600; margin-top: 3px;">
          Consultoria Estratégica, Auditoria Contratual e Blindagem de Riscos Corporativos
        </div>
      </div>
      <div style="text-align: right; font-size: 10px; color: #475569;">
        <div style="font-weight: 900; font-size: 12px; color: #0f172a; text-transform: uppercase;">
          PARECER TÉCNICO-JURÍDICO
        </div>
        <div style="margin-top: 2px;">
          Versão v${versao}.0 • ${dataHoje}
        </div>
        <div style="font-family: monospace; color: #94a3b8; font-size: 9px;">
          ${docCode}
        </div>
      </div>
    </div>

    <!-- TARJA DE NOTA DE GOVERNANÇA -->
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px;">
      <strong style="display: block; font-size: 10px; text-transform: uppercase; color: #92400e; margin-bottom: 2px;">
        Nota de Governança & Validação Profissional:
      </strong>
      <div style="font-size: 10px; color: #78350f; line-height: 1.4;">
        Este relatório constitui instrumento de apoio técnico-jurídico corporativo. As análises, diagnósticos, deliberações e minutas blindadas abaixo apresentados foram calibrados com base na legislação civil brasileira e devem ser formalmente chancelados pelo advogado responsável antes da subscrição definitiva com a contraparte.
      </div>
    </div>

    <!-- DADOS DO INSTRUMENTO E SCORE DE RISCO -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div style="flex: 1;">
        <h2 style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 0 0 6px 0;">
          ${escapeHtml(report.titulo || 'Auditoria & Parecer Jurídico')}
        </h2>
        <div style="font-size: 11px; color: #475569;">
          <strong style="color: #0f172a;">Partes & Objeto:</strong> ${escapeHtml(report.partesIdentificadas || 'Partes e instrumento analisados')}
        </div>
        <div style="font-size: 11px; color: #475569; margin-top: 3px;">
          <strong style="color: #0f172a;">Data de Análise:</strong> ${dataHoje}
        </div>
      </div>
      <div style="text-align: right; margin-left: 20px;">
        <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
          Índice de Exposição
        </div>
        <div style="display: inline-flex; align-items: center; gap: 8px;">
          <span style="font-size: 15px; font-weight: 900; color: #0f172a;">
            Score ${report.scoreRisco}/100
          </span>
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; background-color: ${scoreBg}; color: ${scoreColor}; border: 1px solid ${scoreBorder};">
            Risco ${escapeHtml(report.classificacaoRisco)}
          </span>
        </div>
      </div>
    </div>

    <!-- DELIBERAÇÕES DA CONVERSA (SE HOUVER) -->
    ${ajustesConversaHtml}

    <!-- 1. SÍNTESE EXECUTIVA & DIAGNÓSTICO ESTRATÉGICO -->
    <div style="page-break-inside: avoid; break-inside: avoid; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
      <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0 0 8px 0;">
        1. Síntese Executiva & Diagnóstico Estratégico
      </h3>
      <div style="font-size: 11px; color: #1e293b; line-height: 1.5; text-align: justify; white-space: pre-line; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
        ${escapeHtml(report.resumoExecutivo)}
      </div>
    </div>

    <!-- 2. CONFRONTO PROBATÓRIO -->
    ${corroborativoHtml}

    <!-- 3. PRINCIPAIS RISCOS -->
    ${riscosHtml}

    <!-- 4. EMBASAMENTO LEGAL -->
    ${fundamentacaoHtml}

    <!-- 5. AUDITORIA CLÁUSULA A CLÁUSULA -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0;">
          5. Auditoria Cláusula a Cláusula & Minutas de Redação Blindada
        </h3>
        <span style="font-size: 10px; font-weight: bold; color: #64748b;">
          Total: ${report.clausulas?.length || 0} cláusula(s) auditada(s)
        </span>
      </div>
      ${clausulasHtml}
    </div>

    <!-- 6. ESTRATÉGIA NEGOCIAL -->
    ${estrategiaHtml}

    <!-- 7. HISTÓRICO DA CONSULTORIA INTERATIVA -->
    ${chatConsultoriaHtml}

    <!-- 8. PARECER FORMAL TEXTUAL -->
    ${parecerTextoHtml}

    <!-- 9. TERMO DE VALIDAÇÃO E APROVAÇÃO DO ADVOGADO -->
    <div style="page-break-inside: avoid; break-inside: avoid; border: 2px solid #0f172a; border-radius: 8px; padding: 14px; margin-top: 24px; background-color: #f8fafc;">
      <h3 style="font-size: 12px; font-weight: 900; text-transform: uppercase; text-align: center; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin: 0 0 10px 0; letter-spacing: 0.5px;">
        9. TERMO DE VALIDAÇÃO E APROVAÇÃO DO ADVOGADO RESPONSÁVEL
      </h3>
      <div style="font-size: 10px; color: #334155; line-height: 1.4; margin-bottom: 12px; text-align: justify;">
        Declaro que examinei as análises, diagnósticos de vulnerabilidades e minutas blindadas sugeridas neste parecer técnico-jurídico corporativo, manifestando a seguinte conclusão:
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; font-size: 10px; color: #0f172a;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #0f172a; border-radius: 2px;"></span>
          <span><strong>APROVADO INTEGRALMENTE:</strong> Minuta contratual apta para assinatura sem alterações.</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #0f172a; border-radius: 2px;"></span>
          <span><strong>APROVADO COM RESSALVAS:</strong> Aprovado condicionado à substituição pelas Minutas Blindadas recomendadas.</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #0f172a; border-radius: 2px;"></span>
          <span><strong>REJEITADO / DEVOLVIDO:</strong> Minuta com risco crítico. Exige renegociação integral com a contraparte.</span>
        </div>
      </div>

      <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; margin-bottom: 14px;">
        <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #475569; display: block; margin-bottom: 4px;">
          Observações e Ressalvas Adicionais do Advogado:
        </span>
        <div style="border: 1px solid #cbd5e1; border-radius: 4px; height: 45px; background-color: #ffffff;"></div>
      </div>

      <div style="display: flex; justify-content: space-between; gap: 20px; border-top: 1px solid #cbd5e1; padding-top: 14px; font-size: 10px;">
        <div style="flex: 1;">
          <div style="border-bottom: 1px solid #0f172a; margin-bottom: 4px;"></div>
          <div style="font-weight: bold; color: #0f172a;">Assinatura do Advogado(a) Responsável</div>
          <div style="color: #64748b;">Inscrição na OAB: _________________________</div>
        </div>
        <div style="flex: 1; text-align: right;">
          <div style="border-bottom: 1px solid #0f172a; margin-bottom: 4px;"></div>
          <div style="font-weight: bold; color: #0f172a;">Data de Aprovação e Visto Jurídico</div>
          <div style="color: #64748b;">Em _____ / _____ / 202____</div>
        </div>
      </div>
    </div>

    <!-- RODAPÉ CORPORATIVO OFICIAL -->
    <div style="border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 24px; text-align: center; font-size: 9px; color: #64748b; page-break-inside: avoid; break-inside: avoid;">
      <div style="font-weight: bold; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
        LegalOps Brasil • Consultoria e Auditoria Jurídica Corporativa de Alta Performance
      </div>
      <div style="margin-top: 2px;">
        Documento estritamente confidencial e de uso corporativo interno. Fundamentado na Legislação Civil e Processual Brasileira.
      </div>
    </div>
  </div>`;
}

/**
 * Executa a exportação oficial em PDF diretamente no navegador.
 */
export async function downloadReportAsPDF(
  report: StructuredAnalysisResult,
  chatMessages: ChatMessage[] = []
): Promise<void> {
  const htmlContent = buildReportPrintableHtml(report, chatMessages);

  const originalScrollY = window.scrollY;
  window.scrollTo(0, 0);

  // Criar um wrapper visível de renderização no topo com coordenadas absolutas limpas
  const renderContainer = document.createElement('div');
  renderContainer.id = 'legal-pdf-direct-export-container';
  renderContainer.style.position = 'absolute';
  renderContainer.style.top = '0';
  renderContainer.style.left = '0';
  renderContainer.style.width = '794px';
  renderContainer.style.backgroundColor = '#ffffff';
  renderContainer.style.color = '#0f172a';
  renderContainer.style.zIndex = '9999999'; // acima de qualquer elemento
  renderContainer.style.boxSizing = 'border-box';
  renderContainer.style.overflow = 'visible';
  renderContainer.style.opacity = '1';
  renderContainer.innerHTML = htmlContent;

  document.body.appendChild(renderContainer);

  // Aguardar 300ms para layout e renderização completa dos nós DOM
  await new Promise((resolve) => setTimeout(resolve, 300));

  const cleanTitle = (report.titulo || 'Parecer_Juridico')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 30);

  const opt = {
    margin: [10, 8, 10, 8],
    filename: `Parecer_Juridico_${cleanTitle}_v${report.versaoParecer || 1}_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 794,
      backgroundColor: '#ffffff',
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  try {
    // @ts-ignore
    if (typeof window.html2pdf !== 'undefined') {
      // @ts-ignore
      await window.html2pdf().set(opt).from(renderContainer).save();
    } else {
      // Fallback para impressão se html2pdf não estiver acessível
      window.print();
    }
  } catch (err) {
    console.error('Falha na geração direta do PDF com html2pdf:', err);
    window.print();
  } finally {
    if (renderContainer.parentNode) {
      document.body.removeChild(renderContainer);
    }
    window.scrollTo(0, originalScrollY);
  }
}
