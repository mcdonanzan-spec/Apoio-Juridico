import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { LegalAnalysisInput, StructuredAnalysisResult } from './types';

const app = express();
const PORT = 3000;

// High payload limit for documents / base64 PDFs
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Lazy getter for GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Robust caller with exponential backoff retry and model fallback
 * Resolves transient 503 ("high demand") or 429 errors seamlessly
 */
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config: any;
  }
): Promise<any> {
  // Ordered by current real-time availability and speed
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      console.log(`[Gemini] Consultando modelo: ${model}...`);
      
      // Fast-failover timeout (22s) so queued or hung calls quickly rotate to active models
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout de 22s excedido no modelo ${model}`)), 22000)
        ),
      ]);

      console.log(`[Gemini] Sucesso com modelo: ${model}`);
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[Gemini] Falha no modelo ${model}:`, errMsg);
      // Immediately try the next candidate model in the pool
    }
  }

  throw lastError;
}

// Endpoint: Comprehensive Legal Analysis by Senior Corporate Counsel
app.post('/api/analyze', async (req, res) => {
  try {
    const input: LegalAnalysisInput = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Dados da requisição ausentes.' });
    }

    if (!input.documentoTexto && !input.arquivo && (!input.documentosCorroborativos || input.documentosCorroborativos.length === 0)) {
      return res.status(400).json({
        error: 'Forneça o documento principal a ser analisado ou documentos corroborativos.',
      });
    }

    const ai = getGenAI();

    // Corporate Counsel Persona
    const systemInstruction = `
Você é um Advogado Empresarial Sênior e Estrategista Corporativo de elite no Direito Brasileiro, com mais de 25 anos de experiência nas maiores bancas de advocacia empresarial e departamentos jurídicos corporativos do Brasil.
Sua atuação abrange:
- Direito Contratual Empresarial (B2B, prestação de serviços, fornecimento, parcerias estratégicas, representação comercial, franquias)
- Direito Imobiliário e Construção Civil (Empreitadas globais/unitárias, Incorporação Imobiliária - Lei 4.591/64, locações não residenciais - Lei 8.245/91, distratos - Lei 13.786/18)
- Direito Societário e M&A (Lei 6.404/76, Código Civil, acordos de sócios/acionistas, governança, proteção patrimonial)
- Direito Trabalhista Corporativo & Terceirização (CLT, Lei 13.429/17 e 13.467/17, pejotização, riscos de vínculo e passivos ocultos)
- Direito Tributário e Financeiro (retenções, ISS, IRPJ/CSLL, PIS/COFINS, repasse de tributos e equilíbrio econômico-financeiro)
- Resolução de Disputas, Arbitragem e Compliance (Lei 9.307/96, CPC/15, Lei 12.846/13 - Anticorrupção, LGPD - Lei 13.709/18, Lei da Liberdade Econômica - Lei 13.874/19).

SEU TOM E ESTILO:
- Altamente técnico, seguro, incisivo, analítico e pragmático.
- Fundamentação jurídica viva e profunda: cite expressamente artigos do Código Civil (ex: arts. 413, 421, 422, 478, 610 a 626), Leis Especiais, Súmulas e Teses Firmadas pelo STJ (Recursos Especiais Repetitivos) e STF.
- Foco em resultados de negócios: aponte armadilhas, cláusulas leoninas, assimetrias contratuais, riscos de inadimplemento, multas desproporcionais e execute redação alternativa com cláusulas blindadas prontas para contraproposta.
- ANÁLISE DE DOCUMENTOS CORROBORATIVOS / PROBATÓRIOS:
  Quando fornecidos documentos que corroboram com a decisão (como e-mails, relatórios, atas, propostas comerciais, apresentações .ppt ou minutas .doc/.docx), realize o confronto e cruzamento rigoroso de evidências:
  * O que os documentos de suporte comprovam ou contradizem em relação ao contrato principal?
  * Há promessas comerciais ou de engenharia na apresentação (.ppt) ou proposta (.doc) que foram omitidas no contrato final?
  * Há admissão de culpa, aditivos verbais ou fatos relevantes que blindam a posição do cliente perante o juízo ou câmara arbitral?
- Responda estritamente à instrução / prompt formulado pelo usuário, adaptando o nível de profundidade e direcionamento conforme a consulta.
`;

    // Format optional parameters if present
    const opt = input.parametrosOpcionais || {};
    let contextoOpcional = '';
    if (opt.empresa) contextoOpcional += `- Empresa / Cliente: ${opt.empresa}\n`;
    if (opt.cnpj) contextoOpcional += `- CNPJ: ${opt.cnpj}\n`;
    if (opt.papel) contextoOpcional += `- Posição Contratual defendida: ${opt.papel}\n`;
    if (opt.ramoNegocio) contextoOpcional += `- Ramo do Negócio: ${opt.ramoNegocio}\n`;
    if (opt.valor) contextoOpcional += `- Valor em discussão: ${opt.valor}\n`;
    if (opt.prazo) contextoOpcional += `- Prazos informados: ${opt.prazo}\n`;
    if (opt.garantia) contextoOpcional += `- Garantias: ${opt.garantia}\n`;
    if (opt.multa) contextoOpcional += `- Penalidades/Multas: ${opt.multa}\n`;
    if (opt.preocupacoes) contextoOpcional += `- Preocupações específicas informadas: ${opt.preocupacoes}\n`;
    if (opt.urgencia) contextoOpcional += `- Nível de Urgência: ${opt.urgencia}\n`;
    if (opt.perfilAnalise) contextoOpcional += `- Perfil de Análise solicitado: ${opt.perfilAnalise}\n`;

    const userPromptDirective =
      input.promptSimples && input.promptSimples.trim().length > 0
        ? input.promptSimples.trim()
        : 'Realize uma auditoria jurídica completa de riscos, analisando cláusula por cláusula, apontando armadilhas, fundamentação legal na legislação brasileira e súmulas do STJ/STF, confrontando com os documentos corroborativos apresentados e fornecendo sugestões de redação de cláusulas defensivas para proteger os interesses da empresa.';

    const promptText = `
SOLICITAÇÃO DO CLIENTE / DIRETRIZ DO ADVOGADO:
"${userPromptDirective}"

${contextoOpcional ? `CONTEXTO ADICIONAL FORNECIDO (OPCIONAL):\n${contextoOpcional}\n` : ''}

INSTRUÇÕES PARA O RESULTADO:
Você deve retornar uma resposta em formato JSON estrito, estruturada conforme o schema, contendo:
1. "titulo": Título executivo claro do parecer jurídico.
2. "resumoExecutivo": Resumo executivo objetivo e direto, respondendo com precisão à consulta do cliente e destacando a viabilidade, armadilhas centrais e recomendação primordial.
3. "partesIdentificadas": Qualificação sucinta das partes e do objeto jurídico envolvido.
4. "scoreRisco": Número inteiro de 0 a 100 indicando o risco geral do instrumento/consulta (0 a 30: Baixo risco; 31 a 60: Médio risco; 61 a 80: Alto risco; 81 a 100: Crítico).
5. "classificacaoRisco": "Baixo" | "Médio" | "Alto" | "Crítico".
6. "principaisRiscos": Lista com 3 a 6 riscos principais e pontos de atenção crítica.
7. "fundamentacaoDestaque": Lista de objetos { "norma": string, "aplicacao": string } contendo as principais leis, artigos e súmulas (ex: "Art. 413 do Código Civil", "Súmula 543 do STJ", "Art. 421-A do Código Civil - Liberdade Econômica").
8. "clausulas": Lista de cláusulas críticas analisadas individualmente, com:
   - "numero": número ou referência (ex: "Cláusula 4ª - Do Pagamento e Retenção")
   - "titulo": título temático da cláusula
   - "textoOriginal": trecho ou síntese da redação identificada
   - "grauRisco": "Baixo" | "Médio" | "Alto" | "Crítico"
   - "diagnostico": análise jurídica detalhada do perigo/desequilíbrio
   - "fundamentacaoLegal": fundamentação jurídica no ordenamento brasileiro
   - "redacaoSugerida": minuta de cláusula alternativa recomendada (redação blindada)
9. "estrategiaNegocial": Recomendações práticas e táticas passo a passo para a condução negocial ou procedimental.
10. "documentosCorroborativosAnalisados": Lista de nomes dos documentos corroborativos/probatórios avaliados.
11. "cruzamentoCorroborativo": Análise do confronto entre os documentos corroborativos e o documento principal (reforço probatório, contradições encontradas, alinhamentos ou ressalvas).
12. "relatorioMarkdownCompleto": Parecer formal completo e bem diagramado em Markdown, com linguagem jurídica culta e elegante, pronto para impressão executiva ou apresentação a conselho/diretoria.
`;

    const parts: any[] = [{ text: promptText }];

    // 1. Attach main document data
    if (input.arquivo && input.arquivo.data && input.arquivo.mimeType) {
      if (input.arquivo.mimeType === 'application/pdf') {
        parts.push({
          inlineData: {
            data: input.arquivo.data,
            mimeType: 'application/pdf',
          },
        });
      } else {
        // Text-based files (RTF parsed text, TXT, etc.)
        const content = input.documentoTexto || Buffer.from(input.arquivo.data, 'base64').toString('utf-8');
        parts.push({
          text: `\n--- INÍCIO DO DOCUMENTO PRINCIPAL A SER ANALISADO (${input.arquivo.name}) ---\n${content}\n--- FIM DO DOCUMENTO PRINCIPAL ---`,
        });
      }
    } else if (input.documentoTexto) {
      parts.push({
        text: `\n--- INÍCIO DO DOCUMENTO PRINCIPAL A SER ANALISADO ---\n${input.documentoTexto}\n--- FIM DO DOCUMENTO PRINCIPAL ---`,
      });
    }

    // 2. Attach Corroborating Documents (Documentos que Corroborem com a Decisão: .pdf, .doc, .ppt, etc.)
    if (Array.isArray(input.documentosCorroborativos) && input.documentosCorroborativos.length > 0) {
      parts.push({
        text: `\n=========================================\nDOCUMENTOS CORROBORATIVOS / PROBATÓRIOS EM ANEXO (${input.documentosCorroborativos.length} arquivo(s))\nUse estes documentos para corroborar com a decisão, validar fatos, confrontar obrigações contratuais e enriquecer a fundamentação jurídica:\n=========================================`,
      });

      for (const [idx, cDoc] of input.documentosCorroborativos.entries()) {
        const headerInfo = `\n--- DOCUMENTO CORROBORATIVO ${idx + 1}: "${cDoc.name}" (${cDoc.tipoLabel || cDoc.mimeType})${cDoc.descricao ? ` - Nota: ${cDoc.descricao}` : ''} ---`;

        if (cDoc.mimeType === 'application/pdf' && cDoc.data) {
          parts.push({ text: headerInfo });
          parts.push({
            inlineData: {
              data: cDoc.data,
              mimeType: 'application/pdf',
            },
          });
        } else if (cDoc.extractedText) {
          parts.push({
            text: `${headerInfo}\n${cDoc.extractedText}\n--- FIM DO DOCUMENTO CORROBORATIVO ${idx + 1} ---`,
          });
        } else if (cDoc.data) {
          // If binary or text
          try {
            const raw = Buffer.from(cDoc.data, 'base64').toString('utf-8');
            parts.push({
              text: `${headerInfo}\n${raw.slice(0, 50000)}\n--- FIM DO DOCUMENTO CORROBORATIVO ${idx + 1} ---`,
            });
          } catch {
            // ignore
          }
        }
      }
    }

    const response = await callGeminiWithFallback(ai, {
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titulo: { type: Type.STRING },
            resumoExecutivo: { type: Type.STRING },
            partesIdentificadas: { type: Type.STRING },
            scoreRisco: { type: Type.INTEGER },
            classificacaoRisco: {
              type: Type.STRING,
              description: 'Baixo, Médio, Alto ou Crítico',
            },
            principaisRiscos: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            fundamentacaoDestaque: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  norma: { type: Type.STRING },
                  aplicacao: { type: Type.STRING },
                },
                required: ['norma', 'aplicacao'],
              },
            },
            clausulas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  numero: { type: Type.STRING },
                  titulo: { type: Type.STRING },
                  textoOriginal: { type: Type.STRING },
                  grauRisco: { type: Type.STRING },
                  diagnostico: { type: Type.STRING },
                  fundamentacaoLegal: { type: Type.STRING },
                  redacaoSugerida: { type: Type.STRING },
                },
                required: ['numero', 'titulo', 'grauRisco', 'diagnostico', 'fundamentacaoLegal', 'redacaoSugerida'],
              },
            },
            estrategiaNegocial: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            documentosCorroborativosAnalisados: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            cruzamentoCorroborativo: { type: Type.STRING },
            relatorioMarkdownCompleto: { type: Type.STRING },
          },
          required: [
            'titulo',
            'resumoExecutivo',
            'partesIdentificadas',
            'scoreRisco',
            'classificacaoRisco',
            'principaisRiscos',
            'fundamentacaoDestaque',
            'clausulas',
            'estrategiaNegocial',
          ],
        },
      },
    });

    const rawText = response.text || '{}';
    let parsed: StructuredAnalysisResult;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Fallback if formatting was non-JSON
      parsed = {
        titulo: 'Parecer Jurídico Empresarial',
        resumoExecutivo: rawText,
        partesIdentificadas: 'Conforme documento apresentado',
        scoreRisco: 50,
        classificacaoRisco: 'Médio',
        principaisRiscos: ['Necessidade de revisão detalhada das cláusulas contratuais'],
        fundamentacaoDestaque: [
          { norma: 'Código Civil Brasileiro (Lei 10.406/02)', aplicacao: 'Disposições gerais sobre obrigações e contratos' },
        ],
        clausulas: [],
        estrategiaNegocial: ['Ajustar redação das cláusulas desproporcionais'],
      };
    }

    // Synthesize comprehensive markdown report if not provided directly
    if (!parsed.relatorioMarkdownCompleto) {
      parsed.relatorioMarkdownCompleto = `# ${parsed.titulo || 'PARECER JURÍDICO CORPORATIVO'}

## 1. RESUMO EXECUTIVO
${parsed.resumoExecutivo || ''}

## 2. AVALIAÇÃO E SCORE DE RISCO
**Score:** ${parsed.scoreRisco ?? 50}/100 — **Classificação:** ${parsed.classificacaoRisco || 'Médio'}

## 3. PARTES ENVOLVIDAS
${parsed.partesIdentificadas || 'Conforme instrumento contratual'}

## 4. PRINCIPAIS RISCOS JURÍDICOS
${(parsed.principaisRiscos || []).map((r: string) => `• ${r}`).join('\n')}

${parsed.cruzamentoCorroborativo ? `## 5. CONFRONTO COM DOCUMENTOS CORROBORATIVOS\n${parsed.cruzamentoCorroborativo}\n` : ''}

## 6. FUNDAMENTAÇÃO LEGAL DE DESTAQUE
${(parsed.fundamentacaoDestaque || []).map((f: any) => `• **${f.norma}**: ${f.aplicacao}`).join('\n')}

## 7. AUDITORIA DE CLÁUSULAS E MINUTAS BLINDADAS
${(parsed.clausulas || []).map((c: any) => `### ${c.numero || ''} ${c.titulo || 'Cláusula'} (Risco: ${c.nivelRisco || 'Médio'})
**Texto Original:** ${c.textoOriginal || 'Não informado'}
**Risco Identificado:** ${c.motivoRisco || ''}
**Fundamentação Legal:** ${c.fundamentacaoLegal || 'Código Civil Brasileiro'}
**Redação Blindada Sugerida:**
> ${c.sugestaoRedacaoBlindada || 'Manter redação com ajustes de proporcionalidade.'}
${c.confrontoCorroborativo ? `**Confronto Probatório:** ${c.confrontoCorroborativo}\n` : ''}
${c.estrategiaNegociacao ? `**Estratégia Negocial:** ${c.estrategiaNegociacao}\n` : ''}`).join('\n\n')}

## 8. ESTRATÉGIA DE NEGOCIAÇÃO E PRÓXIMOS PASSOS
${(parsed.estrategiaNegocial || []).map((e: string) => `• ${e}`).join('\n')}`;
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro na análise jurídica:', error);
    const errorMsg = error?.message || String(error);
    return res.status(500).json({
      error: 'Falha ao processar análise jurídica corporativa.',
      details: errorMsg,
    });
  }
});

// Endpoint: Interactive Follow-Up Chat with Corporate Lawyer
app.post('/api/chat', async (req, res) => {
  try {
    const { question, documentContext, previousSummary, history } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Pergunta não informada.' });
    }

    const ai = getGenAI();

    const systemInstruction = `
Você é um Advogado Empresarial Sênior e Consultor Jurídico Corporativo brilhante no Direito Brasileiro.
Você está prestando consultoria contínua para o cliente com base no documento, nos anexos corroborativos e na análise previamente realizada.
Responda com autoridade técnica, precisão jurídica, pragmatismo empresarial e fundamentação na legislação brasileira (Código Civil, CPC, leis extravagantes e jurisprudência dos Tribunais Superiores).
Se o cliente pedir minutas de cláusulas, notificações ou respostas a contrapartes, forneça o texto pronto e devidamente formatado.
`;

    let contextPrompt = `DADOS DO CASO/DOCUMENTO:\n${previousSummary || ''}\n\n`;
    if (documentContext) {
      contextPrompt += `TRECHO/RESUMO DO CONTRATO E DOCUMENTOS CORROBORATIVOS:\n${String(documentContext).slice(0, 20000)}\n\n`;
    }

    if (Array.isArray(history) && history.length > 0) {
      contextPrompt += `HISTÓRICO DA CONVERSA:\n`;
      for (const msg of history) {
        contextPrompt += `${msg.sender === 'user' ? 'Cliente' : 'Advogado'}: ${msg.text}\n`;
      }
      contextPrompt += `\n`;
    }

    contextPrompt += `NOVA DÚVIDA / SOLICITAÇÃO DO CLIENTE:\n${question}\n\nResponda diretamente como o Advogado Empresarial Sênior:`;

    const response = await callGeminiWithFallback(ai, {
      contents: contextPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return res.json({ answer: response.text || 'Não foi possível formular resposta no momento.' });
  } catch (error: any) {
    console.error('Erro no chat jurídico:', error);
    return res.status(500).json({
      error: 'Falha ao responder à consulta jurídica.',
      details: error?.message || String(error),
    });
  }
});

// Setup Vite middleware for dev or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Advogado Empresarial Corporativo API running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
