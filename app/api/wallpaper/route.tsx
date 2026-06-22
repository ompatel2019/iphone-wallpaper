import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

type VariantConfig = {
  layout: 'yearGrid' | 'monthsGrid' | 'singleMonth';
  bg: string;
  pastColor: string;
  todayColor: string;
  futureColor: string;
  dotShape: 'circle' | 'roundedSquare' | 'square';
  bottom: 'statsLine' | 'progressBar';
  doneColor: string;
  leftColor: string;
  sep1Color: string;
  sep2Color: string;
  pctColor: string;
  quoteColor: string;
  defaultQuote: string;
  fontSize: (w: number) => number;
  topPadding: number;
  availableWidthRatio: number;
  sideMarginRatio: number;
};

const variants: Record<string, VariantConfig> = {
  '1': {
    layout: 'yearGrid',
    bg: '#1a1a1a',
    pastColor: '#ffffff',
    todayColor: '#ff4fa3',
    futureColor: '#333333',
    dotShape: 'roundedSquare',
    bottom: 'statsLine',
    doneColor: '#ffffff',
    leftColor: '#ff4fa3',
    sep1Color: '#ffffff',
    sep2Color: '#888888',
    pctColor: '#888888',
    quoteColor: '#666666',
    defaultQuote: 'keep pushing',
    fontSize: (w) => Math.floor(w / 36),
    topPadding: 0.20,
    availableWidthRatio: 0,
    sideMarginRatio: 0.06,
  },
  '2': {
    layout: 'yearGrid',
    bg: '#1a1a1a',
    pastColor: '#ffffff',
    todayColor: '#ff8c00',
    futureColor: '#333333',
    dotShape: 'circle',
    bottom: 'statsLine',
    doneColor: '#ffffff',
    leftColor: '#ff6b35',
    sep1Color: '#ffffff',
    sep2Color: '#888888',
    pctColor: '#888888',
    quoteColor: '#666666',
    defaultQuote: 'keep pushing',
    fontSize: (w) => Math.floor(w / 32),
    topPadding: 0.20,
    availableWidthRatio: 0,
    sideMarginRatio: 0.06,
  },
  '3': {
    layout: 'yearGrid',
    bg: '#ffffff',
    pastColor: '#111111',
    todayColor: '#ff4fa3',
    futureColor: '#bfbfbf',
    dotShape: 'roundedSquare',
    bottom: 'statsLine',
    doneColor: '#111111',
    leftColor: '#ff4fa3',
    sep1Color: '#ff4fa3',
    sep2Color: '#666666',
    pctColor: '#666666',
    quoteColor: '#555555',
    defaultQuote: 'speed matters',
    fontSize: (w) => Math.floor(w / 32),
    topPadding: 0.20,
    availableWidthRatio: 0,
    sideMarginRatio: 0.06,
  },
  '4': {
    layout: 'monthsGrid',
    bg: '#1a1a1a',
    pastColor: '#ffffff',
    todayColor: '#16a34a',
    futureColor: '#333333',
    dotShape: 'circle',
    bottom: 'statsLine',
    doneColor: '#ffffff',
    leftColor: '#16a34a',
    sep1Color: '#ffffff',
    sep2Color: '#888888',
    pctColor: '#888888',
    quoteColor: '#666666',
    defaultQuote: 'one day at a time',
    fontSize: (w) => Math.floor(w / 32),
    topPadding: 0.18,
    availableWidthRatio: 0,
    sideMarginRatio: 0.06,
  },
  '5': {
    layout: 'yearGrid',
    bg: '#ffffff',
    pastColor: '#111111',
    todayColor: '#1e6bff',
    futureColor: '#bfbfbf',
    dotShape: 'square',
    bottom: 'progressBar',
    doneColor: '#111111',
    leftColor: '#111111',
    sep1Color: '#111111',
    sep2Color: '#111111',
    pctColor: '#111111',
    quoteColor: '#111111',
    defaultQuote: 'vision is not a group project',
    fontSize: (w) => Math.floor(w / 32),
    topPadding: 0.20,
    availableWidthRatio: 0,
    sideMarginRatio: 0.06,
  },
  '6': {
    layout: 'singleMonth',
    bg: '#1a1a1a',
    pastColor: '#ffffff',
    todayColor: '#ff4fa3',
    futureColor: '#333333',
    dotShape: 'roundedSquare',
    bottom: 'statsLine',
    doneColor: '#ffffff',
    leftColor: '#ff4fa3',
    sep1Color: '#ffffff',
    sep2Color: '#888888',
    pctColor: '#888888',
    quoteColor: '#666666',
    defaultQuote: 'keep pushing',
    fontSize: (w) => Math.floor(w / 36),
    topPadding: 0.20,
    availableWidthRatio: 0.78,
    sideMarginRatio: 0,
  },
};

function dotRadius(shape: VariantConfig['dotShape'], size: number): number | string {
  if (shape === 'circle') return '50%' as unknown as number;
  if (shape === 'roundedSquare') return size * 0.25;
  return 0;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const height = parseInt(searchParams.get('height') || '2532');
  const width = parseInt(searchParams.get('width') || '1170');
  const varNum = searchParams.get('var') || '1';
  const cfg = variants[varNum] || variants['1'];
  const quote = searchParams.get('quote') || cfg.defaultQuote;

  const [fontRegular, fontItalic] = await Promise.all([
    fetch(new URL('../../fonts/Inter-Regular.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL('../../fonts/Inter-Italic.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
  ]);

  const now = new Date();
  const aestFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = aestFormatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const date = parseInt(parts.find(p => p.type === 'day')!.value);

  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const startOfYearAEST = Date.UTC(year, 0, 1);
  const nowAEST = Date.UTC(year, month, date);
  const dayOfYear = Math.floor((nowAEST - startOfYearAEST) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = isLeapYear(year) ? 366 : 365;
  const daysLeftYear = totalDays - dayOfYear;
  const percentageYear = Math.round((dayOfYear / totalDays) * 100);

  const monthLengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const daysInMonth = monthLengths[month];
  const daysLeftMonth = daysInMonth - date;
  const percentageMonth = Math.round((date / daysInMonth) * 100);

  const topPadding = height * cfg.topPadding;
  const bottomTextSpace = height * 0.1;
  const gapBetweenGridAndText = height * 0.04;
  const fontSize = cfg.fontSize(width);
  const dotSeparatorSize = fontSize * 0.20;

  const fonts = [
    { name: 'Inter', data: fontRegular, style: 'normal' as const },
    { name: 'Inter', data: fontItalic, style: 'italic' as const },
  ];

  // --- YEAR GRID (var 1, 2, 3, 5) ---
  if (cfg.layout === 'yearGrid') {
    const cols = 15;
    const rows = 24;
    const extraDots = Math.max(totalDays - cols * rows, 0);
    const totalRows = rows + (extraDots > 0 ? 1 : 0);
    const sideMargin = width * cfg.sideMarginRatio;
    const availableWidth = width - sideMargin * 0.5;
    const availableHeight = height - topPadding - bottomTextSpace - gapBetweenGridAndText;
    const spacingScale = 0.72;
    const spacingX = (availableWidth / (cols - 1)) * spacingScale;
    const spacingY = (availableHeight / Math.max(totalRows - 1, 1)) * spacingScale;
    const dotSize = Math.min(spacingX, spacingY) * 0.8;
    const gridWidth = (cols - 1) * spacingX + dotSize;
    const gridHeight = (totalRows - 1) * spacingY + dotSize;

    const dots = Array.from({ length: totalDays }, (_, i) => {
      const d = i + 1;
      if (d < dayOfYear) return cfg.pastColor;
      if (d === dayOfYear) return cfg.todayColor;
      return cfg.futureColor;
    });

    const dotRows: string[][] = [];
    for (let r = 0; r < totalRows; r++) {
      const row: string[] = [];
      const count = r < rows ? cols : extraDots;
      for (let c = 0; c < count; c++) {
        const idx = r * cols + c;
        if (idx < totalDays) row.push(dots[idx]);
      }
      dotRows.push(row);
    }

    const gridJsx = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacingY - dotSize, width: gridWidth, height: gridHeight }}>
        {dotRows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', flexDirection: 'row', gap: spacingX - dotSize }}>
            {row.map((color, ci) => (
              <div key={ci} style={{ width: dotSize, height: dotSize, borderRadius: dotRadius(cfg.dotShape, dotSize), backgroundColor: color }} />
            ))}
          </div>
        ))}
      </div>
    );

    // Progress bar bottom (var 5)
    if (cfg.bottom === 'progressBar') {
      const progressBarWidth = Math.floor(gridWidth * 0.5);
      const progressBarHeight = Math.max(8, Math.floor(fontSize * 0.5));
      const progressFillWidth = Math.round((progressBarWidth * percentageYear) / 100);

      return new ImageResponse(
        (
          <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: cfg.bg, fontFamily: 'Inter' }}>
            <div style={{ height: topPadding, display: 'flex' }} />
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>{gridJsx}</div>
            <div style={{ height: gapBetweenGridAndText, display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: fontSize * 0.35, marginTop: -(fontSize * 0.8) }}>
              <div style={{ display: 'flex', width: progressBarWidth, justifyContent: 'space-between', fontSize: fontSize * 0.75 }}>
                <span style={{ color: cfg.doneColor }}>{dayOfYear}d done</span>
                <span style={{ color: cfg.doneColor }}>{totalDays}d total</span>
              </div>
              <div style={{ display: 'flex', width: progressBarWidth, height: progressBarHeight, borderRadius: progressBarHeight / 2, backgroundColor: '#333333', overflow: 'hidden' }}>
                <div style={{ width: progressFillWidth, height: '100%', backgroundColor: cfg.todayColor, borderRadius: progressBarHeight / 2 }} />
              </div>
            </div>
            <div style={{ height: bottomTextSpace, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: fontSize * 0.4 }}>
              <span style={{ fontFamily: 'Inter', fontStyle: 'italic', fontSize: fontSize * 0.85, color: cfg.quoteColor }}>{quote}</span>
            </div>
          </div>
        ),
        { width, height, fonts }
      );
    }

    // Stats line bottom (var 1, 2, 3)
    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: cfg.bg, fontFamily: 'Inter' }}>
          <div style={{ height: topPadding, display: 'flex' }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>{gridJsx}</div>
          <div style={{ height: gapBetweenGridAndText, display: 'flex' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', fontSize }}>
              <span style={{ color: cfg.doneColor }}>{dayOfYear}d done</span>
              <div style={{ width: dotSeparatorSize, height: dotSeparatorSize, borderRadius: '50%', backgroundColor: cfg.sep1Color, marginLeft: fontSize * 0.5, marginRight: fontSize * 0.5 }} />
              <span style={{ color: cfg.leftColor }}>{daysLeftYear}d left</span>
              <div style={{ width: dotSeparatorSize, height: dotSeparatorSize, borderRadius: '50%', backgroundColor: cfg.sep2Color, marginLeft: fontSize * 0.5, marginRight: fontSize * 0.5 }} />
              <span style={{ color: cfg.pctColor }}>{percentageYear}%</span>
            </div>
          </div>
          <div style={{ height: bottomTextSpace, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: fontSize * 0.4 }}>
            <span style={{ fontFamily: 'Inter', fontStyle: 'italic', fontSize: fontSize * 0.85, color: cfg.quoteColor }}>{quote}</span>
          </div>
        </div>
      ),
      { width, height, fonts }
    );
  }

  // --- MONTHS GRID (var 4) ---
  if (cfg.layout === 'monthsGrid') {
    const sideMargin = width * cfg.sideMarginRatio;
    const availableWidth = width - sideMargin * 0.5;
    const availableHeight = height - topPadding - bottomTextSpace - gapBetweenGridAndText;

    const monthGridCols = 3;
    const monthGridRows = 4;
    const monthAreaWidth = availableWidth * 0.8;
    const monthAreaHeight = availableHeight * 0.7;
    const monthGapX = monthAreaWidth * 0.04;
    const monthGapY = monthAreaHeight * 0.06;
    const monthBlockWidth = (monthAreaWidth - monthGapX * (monthGridCols - 1)) / monthGridCols;
    const monthBlockHeight = (monthAreaHeight - monthGapY * (monthGridRows - 1)) / monthGridRows;

    const innerCols = 7;
    const innerRows = 5;
    const monthLabelHeight = monthBlockHeight * 0.15;
    const monthGridHeight = monthBlockHeight - monthLabelHeight;
    const innerSpacingScale = 0.72;
    const innerSpacingX = (monthBlockWidth / (innerCols - 1 || 1)) * innerSpacingScale;
    const innerSpacingY = (monthGridHeight / (innerRows - 1 || 1)) * innerSpacingScale;
    const dotSize = Math.min(innerSpacingX, innerSpacingY) * 0.8;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let dayCounter = 1;
    const monthsData = monthLengths.map((days, mi) => {
      const dayDots = Array.from({ length: days }, (_, i) => {
        const abs = dayCounter + i;
        if (abs < dayOfYear) return cfg.pastColor;
        if (abs === dayOfYear) return cfg.todayColor;
        return cfg.futureColor;
      });
      dayCounter += days;
      return { name: monthNames[mi], days: dayDots };
    });

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: cfg.bg, fontFamily: 'Inter' }}>
          <div style={{ height: topPadding, display: 'flex' }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: monthGapY, width: monthAreaWidth, height: monthAreaHeight }}>
              {Array.from({ length: monthGridRows }, (_, rowIdx) => (
                <div key={rowIdx} style={{ display: 'flex', flexDirection: 'row', gap: monthGapX, justifyContent: 'flex-start' }}>
                  {Array.from({ length: monthGridCols }, (_, colIdx) => {
                    const mi = rowIdx * monthGridCols + colIdx;
                    const md = monthsData[mi];
                    if (!md) return null;
                    return (
                      <div key={md.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: monthBlockWidth, height: monthBlockHeight }}>
                        <div style={{ height: monthLabelHeight, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: Math.floor(width / 32) * 0.75, color: '#aaaaaa', marginBottom: monthGridHeight * 0.02 }}>
                          {md.name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: innerSpacingY - dotSize, justifyContent: 'flex-start' }}>
                          {Array.from({ length: innerRows }, (_, ir) => (
                            <div key={ir} style={{ display: 'flex', flexDirection: 'row', gap: innerSpacingX - dotSize, justifyContent: 'center' }}>
                              {Array.from({ length: innerCols }, (_, ic) => {
                                const di = ir * innerCols + ic;
                                const color = md.days[di];
                                return (
                                  <div key={ic} style={{ width: dotSize, height: dotSize, borderRadius: '50%', backgroundColor: color || 'transparent' }} />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: gapBetweenGridAndText, display: 'flex' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', fontSize }}>
              <span style={{ color: cfg.doneColor }}>{dayOfYear}d done</span>
              <div style={{ width: dotSeparatorSize, height: dotSeparatorSize, borderRadius: '50%', backgroundColor: cfg.sep1Color, marginLeft: fontSize * 0.5, marginRight: fontSize * 0.5 }} />
              <span style={{ color: cfg.leftColor }}>{daysLeftYear}d left</span>
              <div style={{ width: dotSeparatorSize, height: dotSeparatorSize, borderRadius: '50%', backgroundColor: cfg.sep2Color, marginLeft: fontSize * 0.5, marginRight: fontSize * 0.5 }} />
              <span style={{ color: cfg.pctColor }}>{percentageYear}%</span>
            </div>
          </div>
          <div style={{ height: bottomTextSpace, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: fontSize * 0.4 }}>
            <span style={{ fontFamily: 'Inter', fontStyle: 'italic', fontSize: fontSize * 0.85, color: cfg.quoteColor }}>{quote}</span>
          </div>
        </div>
      ),
      { width, height, fonts }
    );
  }

  // --- VAR 6: just text, centered ---
  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: cfg.bg, fontFamily: 'Inter' }}>
        <span style={{ fontSize: Math.floor(width / 10), fontWeight: 600, color: '#ffffff', textAlign: 'center' }}>
          stfu hirang you idiot
        </span>
      </div>
    ),
    { width, height, fonts }
  );
}
