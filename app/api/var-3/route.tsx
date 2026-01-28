import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const height = parseInt(searchParams.get('height') || '2532');
  const width = parseInt(searchParams.get('width') || '1170');

  // Load subset fonts (only ~100KB total instead of 800KB)
  const [fontRegular, fontItalic] = await Promise.all([
    fetch(new URL('../../fonts/Inter-Regular.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL('../../fonts/Inter-Italic.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
  ]);

  // Calculate day of year and progress using AEST timezone (UTC+10)
  const now = new Date();
  // Format date in AEST timezone
  const aestFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = aestFormatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // JS months are 0-indexed
  const date = parseInt(parts.find(p => p.type === 'day')!.value);

  // Calculate day of year in AEST
  const startOfYearAEST = Date.UTC(year, 0, 1);
  const nowAEST = Date.UTC(year, month, date);
  const dayOfYear = Math.floor((nowAEST - startOfYearAEST) / (1000 * 60 * 60 * 24)) + 1;
  const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDays = isLeapYear(year) ? 366 : 365;
  const daysLeft = totalDays - dayOfYear;
  const percentage = Math.round((dayOfYear / totalDays) * 100);

  // Layout calculations (keep overall content area the same size)
  // Slightly reduced top padding so the month grid sits a bit higher,
  // using some of the free space above while still leaving room for
  // widgets and time.
  const topPadding = height * 0.18; // Top padding to push content down
  const bottomTextSpace = height * 0.1; // Reduced bottom text area
  const gapBetweenGridAndText = height * 0.04; // Small gap between grid and text
  const sideMargin = width * 0.06;

  const availableWidth = width - (sideMargin * 0.5);
  const availableHeight = height - topPadding - bottomTextSpace - gapBetweenGridAndText;

  // Month layout configuration (3 columns x 4 rows of months)
  const monthGridCols = 3;
  const monthGridRows = 4;

  // Use a slightly smaller area than the full available space
  // so the grid feels more condensed and leaves breathing room,
  // similar to the other variants.
  const monthAreaWidth = availableWidth * 0.8;
  const monthAreaHeight = availableHeight * 0.7;

  const monthGapX = monthAreaWidth * 0.04;
  // Increase vertical spacing between month rows so the grid
  // feels more open vertically while keeping the same width.
  const monthGapY = monthAreaHeight * 0.06;

  const monthBlockWidth =
    (monthAreaWidth - monthGapX * (monthGridCols - 1)) / monthGridCols;
  const monthBlockHeight =
    (monthAreaHeight - monthGapY * (monthGridRows - 1)) / monthGridRows;

  // Inner grid for each month (calendar-style 7 columns x 5 rows)
  const innerCols = 7;
  const innerRows = 5;
  const monthLabelHeight = monthBlockHeight * 0.15;
  const monthGridHeight = monthBlockHeight - monthLabelHeight;

  const innerSpacingScale = 0.72;
  const innerSpacingX =
    (monthBlockWidth / (innerCols - 1 || 1)) * innerSpacingScale;
  const innerSpacingY =
    (monthGridHeight / (innerRows - 1 || 1)) * innerSpacingScale;

  const dotSize = Math.min(innerSpacingX, innerSpacingY) * 0.8;

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const monthLengths = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  // Generate month/day color data using same color scheme as before
  let dayCounter = 1;
  const monthsData = monthLengths.map((daysInMonth, monthIndex) => {
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const absoluteDay = dayCounter + i;
      let color: string;
      if (absoluteDay < dayOfYear) {
        color = '#ffffff'; // Past days - white
      } else if (absoluteDay === dayOfYear) {
        color = '#16a34a'; // Current day - green
      } else {
        color = '#333333'; // Future days - dark gray
      }
      return { color };
    });
    dayCounter += daysInMonth;
    return {
      name: monthNames[monthIndex],
      days,
    };
  });

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

        {/* Grid container - takes up flexible space, grid aligned to bottom */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: monthGapY,
              width: monthAreaWidth,
              height: monthAreaHeight,
            }}
          >
            {Array.from({ length: monthGridRows }, (_, rowIndex) => (
              <div
                key={rowIndex}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: monthGapX,
                  justifyContent: 'flex-start',
                }}
              >
                {Array.from({ length: monthGridCols }, (_, colIndex) => {
                  const monthIndex = rowIndex * monthGridCols + colIndex;
                  const monthData = monthsData[monthIndex];
                  if (!monthData) return null;

                  return (
                    <div
                      key={monthData.name}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        // Ensure label + grid are left-aligned within each month block
                        alignItems: 'flex-start',
                        width: monthBlockWidth,
                        height: monthBlockHeight,
                      }}
                    >
                      {/* Month label */}
                      <div
                        style={{
                          height: monthLabelHeight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          fontSize: Math.floor(width / 32) * 0.75,
                          color: '#aaaaaa',
                          // Small gap between month label and its grid
                          marginBottom: monthGridHeight * 0.02,
                        }}
                      >
                        {monthData.name}
                      </div>

                      {/* Month day grid */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: innerSpacingY - dotSize,
                          justifyContent: 'flex-start',
                        }}
                      >
                        {Array.from({ length: innerRows }, (_, innerRow) => (
                          <div
                            key={innerRow}
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: innerSpacingX - dotSize,
                              justifyContent: 'center',
                            }}
                          >
                            {Array.from(
                              { length: innerCols },
                              (_, innerCol) => {
                                const dayIndex =
                                  innerRow * innerCols + innerCol;
                                const day = monthData.days[dayIndex];
                                if (!day) {
                                  // Empty slot to preserve grid shape
                                  return (
                                    <div
                                      key={innerCol}
                                      style={{
                                        width: dotSize,
                                        height: dotSize,
                                        borderRadius: '50%',
                                        backgroundColor: 'transparent',
                                      }}
                                    />
                                  );
                                }

                                return (
                                  <div
                                    key={innerCol}
                                    style={{
                                      width: dotSize,
                                      height: dotSize,
                                      borderRadius: '50%',
                                      backgroundColor: day.color,
                                    }}
                                  />
                                );
                              }
                            )}
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

        {/* Gap between grid and stats */}
        <div style={{ height: gapBetweenGridAndText, display: 'flex' }} />

        {/* Stats text - "Xd done · Xd left · X%" */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
                marginLeft: fontSize * 0.5,
                marginRight: fontSize * 0.5,
              }}
            />

            {/* "Xd left" - green */}
            <span style={{ color: '#16a34a' }}>{daysLeft}d left</span>

            {/* Dot separator - gray */}
            <div
              style={{
                width: dotSeparatorSize,
                height: dotSeparatorSize,
                borderRadius: '50%',
                backgroundColor: '#888888',
                marginLeft: fontSize * 0.5,
                marginRight: fontSize * 0.5,
              }}
            />

            {/* "X%" - gray */}
            <span style={{ color: '#888888' }}>{percentage}%</span>
          </div>
        </div>

        {/* Italic message below stats */}
        <div
          style={{
            height: bottomTextSpace,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: fontSize * 0.4,
          }}
        >
          <span
            style={{
              fontFamily: 'Inter',
              fontStyle: 'italic',
              fontSize: fontSize * 0.85,
              color: '#666666',
            }}
          >
            one day at a time
          </span>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        {
          name: 'Inter',
          data: fontRegular,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: fontItalic,
          style: 'italic',
        },
      ],
    }
  );
}
