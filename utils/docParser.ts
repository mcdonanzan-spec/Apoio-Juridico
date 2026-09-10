import JSZip from 'jszip';
import mammoth from 'mammoth';
import { extractTextFromRTF } from './rtfParser';

export interface ParsedDocResult {
  text: string;
  typeLabel: string;
  charCount: number;
}

/**
 * Extracts printable text strings from binary buffers (for legacy .doc and .ppt)
 */
function extractStringsFromBinary(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  const chunks: string[] = [];

  // Look for UTF-16LE or ASCII printable sequences of length >= 4
  let currentChunk: number[] = [];
  let isUtf16 = false;

  for (let i = 0; i < len; i++) {
    const b = bytes[i];
    // check for ASCII printable or common latin characters
    if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9 || (b >= 192 && b <= 255)) {
      currentChunk.push(b);
    } else if (b === 0 && currentChunk.length > 0 && i + 1 < len) {
      // possible UTF-16LE separator
      const nextB = bytes[i + 1];
      if ((nextB >= 32 && nextB <= 126) || (nextB >= 192 && nextB <= 255)) {
        // continue
      } else {
        if (currentChunk.length >= 4) {
          try {
            const str = new TextDecoder('utf-8').decode(new Uint8Array(currentChunk));
            const cleaned = str.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, ' ').trim();
            if (cleaned.length >= 4 && /[a-zA-Z0-9À-ÿ]/.test(cleaned)) {
              chunks.push(cleaned);
            }
          } catch {
            // ignore
          }
        }
        currentChunk = [];
      }
    } else {
      if (currentChunk.length >= 4) {
        try {
          const str = new TextDecoder('utf-8').decode(new Uint8Array(currentChunk));
          const cleaned = str.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, ' ').trim();
          if (cleaned.length >= 4 && /[a-zA-Z0-9À-ÿ]/.test(cleaned)) {
            chunks.push(cleaned);
          }
        } catch {
          // ignore
        }
      }
      currentChunk = [];
    }
  }

  // Deduplicate and filter noise words
  const filtered = chunks.filter(c => {
    if (c.length < 3) return false;
    if (/^(Root Entry|WordDocument|SummaryInformation|Current User|PowerPoint Document)/i.test(c)) return false;
    return true;
  });

  return filtered.join('\n');
}

/**
 * Extracts slide text from PPTX (Office Open XML PowerPoint)
 */
async function extractTextFromPptx(file: File | ArrayBuffer): Promise<string> {
  const zip = new JSZip();
  const loaded = await zip.loadAsync(file);

  const slideFiles = Object.keys(loaded.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

  const slidesText: string[] = [];

  for (let idx = 0; idx < slideFiles.length; idx++) {
    const fileName = slideFiles[idx];
    const xmlContent = await loaded.files[fileName].async('text');

    // Extract text in <a:t>...</a:t> tags
    const matches = xmlContent.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
    if (matches) {
      const texts = matches
        .map(m => m.replace(/<[^>]+>/g, '').trim())
        .filter(t => t.length > 0);
      if (texts.length > 0) {
        slidesText.push(`[Slide ${idx + 1}]\n${texts.join('\n')}`);
      }
    }
  }

  // Also check notes slides if available
  const notesFiles = Object.keys(loaded.files).filter(name => /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(name));
  if (notesFiles.length > 0) {
    for (let idx = 0; idx < notesFiles.length; idx++) {
      const fileName = notesFiles[idx];
      const xmlContent = await loaded.files[fileName].async('text');
      const matches = xmlContent.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
      if (matches) {
        const texts = matches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(t => t.length > 0);
        if (texts.length > 0) {
          slidesText.push(`[Notas do Slide ${idx + 1}]\n${texts.join('\n')}`);
        }
      }
    }
  }

  return slidesText.join('\n\n');
}

/**
 * Universal parser for legal & corroborating documents (.pdf, .doc, .docx, .ppt, .pptx, .rtf, .txt)
 */
export async function parseDocumentFile(file: File): Promise<ParsedDocResult> {
  const fileNameLower = file.name.toLowerCase();

  // 1. RTF (Rich Text)
  if (fileNameLower.endsWith('.rtf') || file.type.includes('rtf')) {
    const raw = await file.text();
    const text = extractTextFromRTF(raw);
    return {
      text,
      typeLabel: 'RTF (Rich Text)',
      charCount: text.length,
    };
  }

  // 2. DOCX (Word Open XML)
  if (fileNameLower.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value.trim();
      return {
        text,
        typeLabel: 'Word (.DOCX)',
        charCount: text.length,
      };
    } catch (err) {
      console.warn('Falha mammoth DOCX, tentando fallback:', err);
    }
  }

  // 3. PPTX (PowerPoint Open XML)
  if (fileNameLower.endsWith('.pptx')) {
    try {
      const text = await extractTextFromPptx(file);
      return {
        text,
        typeLabel: 'PowerPoint (.PPTX)',
        charCount: text.length,
      };
    } catch (err) {
      console.warn('Falha PPTX parser, tentando fallback:', err);
    }
  }

  // 4. Legacy DOC (Word 97-2004 binary)
  if (fileNameLower.endsWith('.doc')) {
    try {
      // First try mammoth in case it's actually docx renamed
      const arrayBuffer = await file.arrayBuffer();
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result.value && result.value.trim().length > 50) {
          return {
            text: result.value.trim(),
            typeLabel: 'Word (.DOC)',
            charCount: result.value.trim().length,
          };
        }
      } catch {
        // expected for real binary .doc
      }

      const text = extractStringsFromBinary(arrayBuffer);
      return {
        text,
        typeLabel: 'Word (.DOC)',
        charCount: text.length,
      };
    } catch (err) {
      console.warn('Falha .doc parser:', err);
    }
  }

  // 5. Legacy PPT (PowerPoint 97-2004 binary)
  if (fileNameLower.endsWith('.ppt')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = extractStringsFromBinary(arrayBuffer);
      return {
        text,
        typeLabel: 'PowerPoint (.PPT)',
        charCount: text.length,
      };
    } catch (err) {
      console.warn('Falha .ppt parser:', err);
    }
  }

  // 6. PDF (.pdf)
  if (fileNameLower.endsWith('.pdf') || file.type === 'application/pdf') {
    return {
      text: '', // PDF will be sent as base64 inlineData to Gemini
      typeLabel: 'PDF Document',
      charCount: 0,
    };
  }

  // 7. TXT / CSV / Markdown
  try {
    const text = await file.text();
    return {
      text: text.trim(),
      typeLabel: 'Texto (.TXT)',
      charCount: text.trim().length,
    };
  } catch {
    return {
      text: '',
      typeLabel: 'Arquivo Anexo',
      charCount: 0,
    };
  }
}
