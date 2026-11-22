import type { AttemptItem, GameStatus, LetterStatus } from '../types/api';

export type ShareImageOutcome = 'shared' | 'copied' | 'downloaded';

export interface ShareResultImageParams {
  attempts: AttemptItem[];
  status: GameStatus;
  date?: Date;
}

const TILE_COLORS: Record<LetterStatus, string> = {
  correct: '#3aa394',
  present: '#d3ad69',
  absent: '#312a2c',
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function formatShareDate(date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export async function generateResultImageBlob({
  attempts,
  status,
  date = new Date(),
}: ShareResultImageParams): Promise<Blob> {
  const cols = 5;
  const rowsCount = Math.max(attempts.length, 1);
  const tileSize = 56;
  const tileGap = 10;
  const gridWidth = cols * tileSize + (cols - 1) * tileGap;
  const gridHeight = rowsCount * tileSize + (rowsCount - 1) * tileGap;

  const canvasWidth = 460;
  const headerHeight = 135;
  const footerHeight = 85;
  const canvasHeight = headerHeight + gridHeight + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Fundo principal (#121213)
    ctx.fillStyle = '#121213';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Card interno com borda sutil (#18181b)
    const cardPadding = 18;
    ctx.fillStyle = '#18181b';
    drawRoundedRect(
      ctx,
      cardPadding,
      cardPadding,
      canvasWidth - cardPadding * 2,
      canvasHeight - cardPadding * 2,
      20
    );
    ctx.fill();

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Título "DECIFRA"
    ctx.fillStyle = '#f4f4f5';
    ctx.font = '800 34px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DECIFRA', canvasWidth / 2, 62);

    // Subtítulo com placar e data do dia
    const scoreLabel = status === 'won' ? `${attempts.length}/6` : 'X/6';
    const dateLabel = formatShareDate(date);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 16px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText(`Placar: ${scoreLabel}  •  ${dateLabel}`, canvasWidth / 2, 100);

    // Grid de tentativas (sem letras para evitar spoiler)
    const startX = (canvasWidth - gridWidth) / 2;
    const startY = headerHeight;

    attempts.forEach((attempt, rowIndex) => {
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        const letterStatus = attempt.feedback[colIndex] || 'absent';
        const x = startX + colIndex * (tileSize + tileGap);
        const y = startY + rowIndex * (tileSize + tileGap);

        ctx.fillStyle = TILE_COLORS[letterStatus] || TILE_COLORS.absent;
        drawRoundedRect(ctx, x, y, tileSize, tileSize, 10);
        ctx.fill();
      }
    });

    // Linha divisória do rodapé
    const footerLineY = canvasHeight - 62;
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(46, footerLineY);
    ctx.lineTo(canvasWidth - 46, footerLineY);
    ctx.stroke();

    // Assinatura discreta no rodapé do card
    ctx.fillStyle = '#71717a';
    ctx.font = '500 12px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText(
      'Desenvolvido por Gustavo Baltieri • github.com/gjbaltieri',
      canvasWidth / 2,
      canvasHeight - 38
    );
  }

  return new Promise<Blob>((resolve) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          resolve(new Blob(['decifra-png'], { type: 'image/png' }));
        }
      }, 'image/png');
    } else {
      resolve(new Blob(['decifra-png'], { type: 'image/png' }));
    }
  });
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const hasCreateObjectURL =
    typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
  const objectUrl = hasCreateObjectURL
    ? URL.createObjectURL(blob)
    : 'data:image/png;base64,';

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (hasCreateObjectURL && typeof URL.revokeObjectURL === 'function') {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

export async function shareResultImage(
  params: ShareResultImageParams
): Promise<ShareImageOutcome> {
  const blob = await generateResultImageBlob(params);
  const filename = 'decifra-resultado.png';
  const file = new File([blob], filename, { type: 'image/png' });

  // 1. Tenta Web Share API com arquivo quando suportado
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  ) {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'DECIFRA',
        });
        return 'shared';
      }
    } catch (err) {
      // Se o usuário cancelou o share nativo (AbortError), não força download
      if (err instanceof Error && err.name === 'AbortError') {
        return 'shared';
      }
      // Caso contrário, prossegue para o fallback de clipboard / download
    }
  }

  // 2. Tenta copiar a imagem PNG para a área de transferência
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.write === 'function' &&
    typeof ClipboardItem !== 'undefined'
  ) {
    try {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return 'copied';
    } catch {
      // Prossegue para o download automático se o navegador bloquear
    }
  }

  // 3. Fallback: download automático de decifra-resultado.png
  triggerBlobDownload(blob, filename);
  return 'downloaded';
}
