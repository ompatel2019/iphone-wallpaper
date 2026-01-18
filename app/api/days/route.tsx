import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const height = parseInt(searchParams.get('height') || '2532');
  const width = parseInt(searchParams.get('width') || '1170');

  // Load font
  const fontData = await fetch(
    new URL('./Inter-Regular.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

  // Calculate day of year and progress
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDays = isLeapYear(now.getFullYear()) ? 366 : 365;
  const daysLeft = totalDays - dayOfYear;
  const percentage = Math.round((dayOfYear / totalDays) * 100);

  // Grid configuration - 15 columns x 24 rows + leftover row
  const cols = 15;
  const rows = 24;
  const extraDots = Math.max(totalDays - cols * rows, 0);
  const totalRows = rows + (extraDots > 0 ? 1 : 0);

  // Layout calculations (matching original proportions)
  const topPadding = height * 0.24;
  const bottomTextSpace = height * 0.08;
  const sideMargin = width * 0.06;

  const availableWidth = width - (sideMargin * 2);
  const availableHeight = height - topPadding - bottomTextSpace;

  // Calculate spacing (matching original scale)
  const spacingScale = 0.75;
  const spacingX = (availableWidth / (cols - 1)) * spacingScale;
  const spacingY = (availableHeight / (Math.max(totalRows - 1, 1))) * spacingScale;

  // Dot size
  const dotSize = Math.min(spacingX, spacingY) * 0.88;

  // Calculate grid dimensions for centering
  const gridWidth = (cols - 1) * spacingX + dotSize;
  const gridHeight = (totalRows - 1) * spacingY + dotSize;

  // Generate dots array
  const dots = Array.from({ length: totalDays }, (_, i) => {
    const dayNumber = i + 1;
    let color: string;
    if (dayNumber < dayOfYear) {
      color = '#ffffff'; // Past days - white
    } else if (dayNumber === dayOfYear) {
      color = '#ff8c00'; // Current day - orange
    } else {
      color = '#333333'; // Future days - dark gray
    }
    return { color };
  });

  // Create rows of dots
  const dotRows: { color: string }[][] = [];
  for (let r = 0; r < totalRows; r++) {
    const rowDots: { color: string }[] = [];
    const dotsInRow = r < rows ? cols : extraDots;
    for (let c = 0; c < dotsInRow; c++) {
      const index = r * cols + c;
      if (index < totalDays) {
        rowDots.push(dots[index]);
      }
    }
    dotRows.push(rowDots);
  }

  const fontSize = Math.floor(width / 32);
  const dotSeparatorSize = fontSize * 0.20;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1a1a1a',
          fontFamily: 'Inter',
        }}
      >
        {/* Top spacer for time/widgets */}
        <div style={{ height: topPadding, display: 'flex' }} />

        {/* Grid container - centered */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacingY - dotSize,
              width: gridWidth,
              height: gridHeight,
            }}
          >
            {dotRows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: spacingX - dotSize,
                }}
              >
                {row.map((dot, colIndex) => (
                  <div
                    key={colIndex}
                    style={{
                      width: dotSize,
                      height: dotSize,
                      borderRadius: '50%',
                      backgroundColor: dot.color,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom text */}
        <div
          style={{
            height: bottomTextSpace * 1.6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: bottomTextSpace * 1.5,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              fontSize: fontSize,
            }}
          >
            {/* "Xd done" - white */}
            <span style={{ color: '#ffffff' }}>{dayOfYear}d done</span>

            {/* Dot separator - white */}
            <div
              style={{
                width: dotSeparatorSize,
                height: dotSeparatorSize,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                marginLeft: fontSize * 0.6,
                marginRight: fontSize * 0.6,
              }}
            />

            {/* "Xd left" - orange */}
            <span style={{ color: '#ff6b35' }}>{daysLeft}d left</span>

            {/* Dot separator - gray */}
            <div
              style={{
                width: dotSeparatorSize,
                height: dotSeparatorSize,
                borderRadius: '50%',
                backgroundColor: '#888888',
                marginLeft: fontSize * 0.6,
                marginRight: fontSize * 0.6,
              }}
            />

            {/* "X%" - gray */}
            <span style={{ color: '#888888' }}>{percentage}%</span>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
        },
      ],
    }
  );
}
