export const getCoverageLines = (text: string) => text.split('\n');

export const getDefaultCoverageFontSize = (linesCount: number) => {
  if (linesCount <= 1) return 18;
  if (linesCount === 2) return 16;
  if (linesCount === 3) return 14;
  return 12;
};

export const normalizeCoverageFontSize = (fontSize: number) => {
  if (!Number.isFinite(fontSize)) return 14;
  return Math.max(10, Math.min(fontSize, 28));
};

export const getCoverageTextSizes = (text: string, sizes: number[] = []) => {
  const lines = getCoverageLines(text);
  const defaultSize = getDefaultCoverageFontSize(lines.length);
  return lines.map((_, index) => normalizeCoverageFontSize(sizes[index] ?? defaultSize));
};
