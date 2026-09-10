/**
 * Utility to parse Rich Text Format (.rtf) files in the browser
 * Extracts plain text, decoding CP1252/Unicode escapes and stripping RTF control tags.
 */

const CP1252_MAP: Record<number, string> = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡',
  0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž',
  0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—',
  0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ'
};

// Destination groups that should be completely skipped along with their nested content
const SKIPPABLE_GROUPS = new Set([
  'fonttbl',
  'colortbl',
  'stylesheet',
  'info',
  'generator',
  'pict',
  'header',
  'footer',
  'headerl',
  'headerr',
  'footerl',
  'footerr',
  'listtable',
  'listoverridetable',
  'xmlnstbl',
  'falt'
]);

export function extractTextFromRTF(rtfContent: string): string {
  if (!rtfContent || !rtfContent.includes('{\\rtf')) {
    // If it doesn't look like RTF, return as-is
    return rtfContent;
  }

  let output = '';
  const len = rtfContent.length;
  let i = 0;
  
  // Group stack to track if current group is skippable
  const groupStack: boolean[] = [];
  let currentGroupIgnored = false;

  while (i < len) {
    const char = rtfContent[i];

    if (char === '{') {
      // Check if this new group is a destination to skip
      groupStack.push(currentGroupIgnored);
      i++;
      
      // Peek ahead to see if it starts with \* or a known skip group
      let peek = i;
      while (peek < len && (rtfContent[peek] === ' ' || rtfContent[peek] === '\r' || rtfContent[peek] === '\n')) {
        peek++;
      }
      
      if (rtfContent.slice(peek, peek + 2) === '\\*') {
        currentGroupIgnored = true;
      } else if (rtfContent[peek] === '\\') {
        // extract control word
        const match = rtfContent.slice(peek + 1, peek + 25).match(/^([a-zA-Z]+)/);
        if (match && SKIPPABLE_GROUPS.has(match[1].toLowerCase())) {
          currentGroupIgnored = true;
        }
      }
      continue;
    }

    if (char === '}') {
      if (groupStack.length > 0) {
        currentGroupIgnored = groupStack.pop() || false;
      }
      i++;
      continue;
    }

    if (currentGroupIgnored) {
      i++;
      continue;
    }

    if (char === '\\') {
      i++;
      if (i >= len) break;

      const nextChar = rtfContent[i];

      // Escaped special characters
      if (nextChar === '\\' || nextChar === '{' || nextChar === '}') {
        output += nextChar;
        i++;
        continue;
      }

      // Hex character code: \'xx
      if (nextChar === "'") {
        i++;
        const hex = rtfContent.slice(i, i + 2);
        if (hex.length === 2 && /^[0-9a-fA-F]{2}$/.test(hex)) {
          const byteVal = parseInt(hex, 16);
          if (byteVal >= 0xA0) {
            output += String.fromCharCode(byteVal);
          } else if (CP1252_MAP[byteVal]) {
            output += CP1252_MAP[byteVal];
          } else {
            output += String.fromCharCode(byteVal);
          }
          i += 2;
        }
        continue;
      }

      // Control word: \word-123 or \word
      const wordMatch = rtfContent.slice(i, i + 32).match(/^([a-zA-Z]+)(-?\d+)?/);
      if (wordMatch) {
        const [fullMatch, word, param] = wordMatch;
        i += fullMatch.length;

        // Skip single optional trailing space delimiter of control words
        if (i < len && rtfContent[i] === ' ') {
          i++;
        }

        const lowerWord = word.toLowerCase();

        // Line break / paragraph
        if (lowerWord === 'par' || lowerWord === 'line') {
          output += '\n';
        } else if (lowerWord === 'tab') {
          output += '\t';
        } else if (lowerWord === 'u' && param !== undefined) {
          // Unicode escape \uN followed by optional fallback char
          let code = parseInt(param, 10);
          if (code < 0) code += 65536;
          output += String.fromCharCode(code);

          // In RTF \uN is followed by \ucM (skip count, default 1). Often followed by '?' or fallback
          if (i < len && (rtfContent[i] === '?' || rtfContent[i] === ' ')) {
            i++;
          }
        }
        continue;
      }

      // If nothing matched, skip the backslash
      continue;
    }

    // Newlines in RTF source code (ignore unless specified by \par)
    if (char === '\r' || char === '\n') {
      i++;
      continue;
    }

    output += char;
    i++;
  }

  // Clean up formatting
  return output
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
