export function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function truncateText(value: string, maxLength: number): string {
  const normalized = normalizeText(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function parseFrontmatter(source: string): Record<string, string> {
  const match = source.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    throw new Error('Missing frontmatter block');
  }

  const result: Record<string, string> = {};

  for (const line of match[1].split('\n')) {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key || !value) {
      continue;
    }

    result[key] = stripWrappingQuotes(value);
  }

  return result;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function mixHex(colorA: string, colorB: string, ratioA = 0.5): string {
  const [r1, g1, b1] = hexToRgb(colorA);
  const [r2, g2, b2] = hexToRgb(colorB);
  const ratio = clamp(ratioA, 0, 1);
  const inverse = 1 - ratio;

  return rgbToHex(
    r1 * ratio + r2 * inverse,
    g1 * ratio + g2 * inverse,
    b1 * ratio + b2 * inverse,
  );
}

export function estimateTitleWidth(title: string, fontSize: number): number {
  const normalized = normalizeText(title);
  const averageGlyphWidth = fontSize * 0.56;
  return normalized.length * averageGlyphWidth;
}

export function balanceText(text: string, lineCount: number): string[] {
  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter(Boolean);

  if (words.length <= lineCount) {
    return [normalized];
  }

  const target = Math.ceil(normalized.length / lineCount);
  let best: string[] = [normalized];
  let bestScore = Number.POSITIVE_INFINITY;

  function search(startIndex: number, linesLeft: number, current: string[]) {
    if (linesLeft === 1) {
      const line = words.slice(startIndex).join(' ');
      const candidate = [...current, line];
      const lengths = candidate.map((entry) => entry.length);
      const longest = Math.max(...lengths);
      const shortest = Math.min(...lengths);
      const variance = lengths.reduce((sum, length) => sum + Math.abs(length - target), 0);
      const score = variance + (longest - shortest) * 1.35;

      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
      return;
    }

    for (let end = startIndex + 1; end <= words.length - linesLeft + 1; end++) {
      const line = words.slice(startIndex, end).join(' ');
      if (line.length > target * 1.42) break;
      search(end, linesLeft - 1, [...current, line]);
    }
  }

  search(0, lineCount, []);
  return best;
}
