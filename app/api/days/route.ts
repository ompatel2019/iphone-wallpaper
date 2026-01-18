import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from 'canvas';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const height = parseInt(searchParams.get('height') || '2532');
  const width = parseInt(searchParams.get('width') || '1170');

  // Calculate day of year and progress
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDays = isLeapYear(now.getFullYear()) ? 366 : 365;
  const daysLeft = totalDays - dayOfYear;
  const percentage = Math.round((dayOfYear / totalDays) * 100);

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background color (dark gray/black)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  // Grid configuration - 15 columns x 24 rows + leftover row
  const cols = 15;
  const rows = 24;
  const totalDots = totalDays;
  const extraDots = Math.max(totalDots - cols * rows, 0);
  const totalRows = rows + (extraDots > 0 ? 1 : 0);
  
  // Leave room for time/widgets at top and breathing room at bottom
  const topPadding = height * 0.18;
  const bottomTextSpace = height * 0.08;
  const sideMargin = width * 0.06;
  
  const availableWidth = width - (sideMargin * 2);
  const availableHeight = height - topPadding - bottomTextSpace;
  
  // Calculate spacing between dot centers (slightly tighter)
  const spacingScale = 0.8;
  const spacingX = (availableWidth / (cols - 1)) * spacingScale;
  const spacingY = (availableHeight / (Math.max(totalRows - 1, 1))) * spacingScale;
  
  // Dot radius - SMALL dots like the original
  const dotRadius = Math.min(spacingX, spacingY) * 0.35;
  
  // Calculate starting position - centered horizontally, starts at top
  const gridWidth = (cols - 1) * spacingX;
  const startX = (width - gridWidth) / 2;
  const gridHeight = (Math.max(totalRows - 1, 1)) * spacingY;
  const startY = topPadding + (availableHeight - gridHeight) / 2;

  // Draw dots
  for (let i = 0; i < totalDots; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    // Skip if we've exceeded the grid rows
    if (row >= totalRows) break;
    
    const rowCols = row < rows ? cols : extraDots;
    if (rowCols === 0) break;

    const rowStartX = row < rows ? startX : startX;
    const x = rowStartX + col * spacingX;
    const y = startY + row * spacingY;
    const dayNumber = i + 1;

    if (dayNumber < dayOfYear) {
      // Past days - white
      ctx.fillStyle = '#ffffff';
    } else if (dayNumber === dayOfYear) {
      // Current day - orange
      ctx.fillStyle = '#ff8c00';
    } else {
      // Future days - very dark gray (barely visible like original)
      ctx.fillStyle = '#333333';
    }

    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw text at very bottom (matching original style)
  const daysLeftText = `${daysLeft}d left`;
  const percentText = ` · ${percentage}%`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.floor(width / 30);
  
  // Measure text to position properly
  ctx.font = `300 ${fontSize}px Arial`;
  const daysLeftWidth = ctx.measureText(daysLeftText).width;
  const percentWidth = ctx.measureText(percentText).width;
  const totalTextWidth = daysLeftWidth + percentWidth;
  
  const textY = height - bottomTextSpace * 1.4;
  const textStartX = (width - totalTextWidth) / 2;
  
  // Orange for "Xd left"
  ctx.fillStyle = '#ff6b35';
  ctx.fillText(daysLeftText, textStartX + daysLeftWidth / 2, textY);
  
  // Gray for " · X%"
  ctx.fillStyle = '#888888';
  ctx.fillText(percentText, textStartX + daysLeftWidth + percentWidth / 2, textY);

  // Convert canvas to PNG buffer
  const buffer = canvas.toBuffer('image/png');
  const body = new Uint8Array(buffer);

  // Return image
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
