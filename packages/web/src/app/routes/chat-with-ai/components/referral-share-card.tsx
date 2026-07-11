import { Check, Copy, Download, Share2 } from 'lucide-react';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import {
  REFERRAL_CARD_COLORS,
  ReferralColor,
  phraseColorIndex,
} from './referral-theme';

export function ReferralShareCard({
  phrase,
  latestPhrase,
}: {
  phrase: string;
  latestPhrase?: string;
}) {
  const trimmed = phrase.trim();
  const shareText = useMemo(() => buildShareText(trimmed), [trimmed]);
  const cards = useMemo(
    () =>
      REFERRAL_CARD_COLORS.map((color) => {
        const svg = buildCardSvg(trimmed, color);
        return { ...color, svg, dataUri: svgToDataUri(svg) };
      }),
    [trimmed],
  );
  // The default color is derived from the phrase, so it varies card-to-card in the wild but is
  // fully deterministic — no visible re-pick on mount, remount, or tab switches.
  const [colorIndex, setColorIndex] = useState(() => phraseColorIndex(trimmed));
  const [view, setView] = useState<'image' | 'text'>('image');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [busyImage, setBusyImage] = useState(false);

  const active = cards[colorIndex] ?? cards[0];

  // The card is drawn as an SVG data URI (crisp, cheap), but a native right-click "Copy image" on
  // an SVG img puts SVG flavors on the clipboard, which chat apps like Discord silently reject.
  // So the ACTIVE layer swaps its src to a rasterized PNG object URL as soon as one is ready —
  // then any copy, drag, or long-press carries real PNG pixels. Lazy per color, cached by SVG
  // string, all URLs revoked on unmount.
  const pngCacheRef = useRef(new Map<string, string>());
  const [, bumpPngVersion] = useReducer((version: number) => version + 1, 0);
  useEffect(() => {
    if (
      trimmed.length === 0 ||
      !active ||
      pngCacheRef.current.has(active.svg)
    ) {
      return undefined;
    }
    let alive = true;
    const svg = active.svg;
    svgToPngBlob(svg)
      .then((blob) => {
        if (!alive || pngCacheRef.current.has(svg)) {
          return;
        }
        pngCacheRef.current.set(svg, URL.createObjectURL(blob));
        bumpPngVersion();
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [trimmed, active]);
  useEffect(() => {
    const cache = pngCacheRef.current;
    return () => {
      for (const url of cache.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  if (trimmed.length === 0) {
    return null;
  }

  // A newer card in this conversation carries a different code: this one no longer redeems, so
  // render it as an inert keepsake — no share, no download, no color picker.
  const stale =
    latestPhrase !== undefined &&
    phraseKey(latestPhrase) !== phraseKey(trimmed);
  if (stale) {
    return (
      <div className="my-2 w-full max-w-[600px]">
        <div className="relative">
          <img
            src={active.dataUri}
            alt="Expired referral card: this code was replaced by a newer one"
            className="w-full rounded-xl opacity-40 saturate-50 ring-1 ring-border/50"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-background/95 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-border">
              No longer valid · replaced by a newer code
            </span>
          </div>
        </div>
      </div>
    );
  }

  const copyText = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 1800);
  };

  const shareTextNative = async () => {
    if (typeof navigator.share === 'function') {
      await navigator
        .share({ title: 'The $10 mission', text: shareText })
        .catch(() => undefined);
    } else {
      await copyText();
    }
  };

  const withImage = async (action: (blob: Blob) => Promise<void> | void) => {
    if (busyImage) {
      return;
    }
    setBusyImage(true);
    try {
      const blob = await svgToPngBlob(active.svg);
      await action(blob);
    } finally {
      setBusyImage(false);
    }
  };

  const downloadImage = () =>
    withImage((blob) => downloadBlob(blob, 'the-10-dollar-mission.png'));

  // Safari only honors clipboard writes when the ClipboardItem is built synchronously inside the
  // user gesture, with the async payload passed as a Promise — so no awaiting before write here.
  const copyImage = async () => {
    if (busyImage) {
      return;
    }
    if (
      typeof ClipboardItem === 'undefined' ||
      typeof navigator.clipboard?.write !== 'function'
    ) {
      await downloadImage();
      return;
    }
    setBusyImage(true);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': svgToPngBlob(active.svg) }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 1800);
    } catch {
      const blob = await svgToPngBlob(active.svg);
      downloadBlob(blob, 'the-10-dollar-mission.png');
    } finally {
      setBusyImage(false);
    }
  };

  const shareImage = () =>
    withImage(async (blob) => {
      const file = new File([blob], 'the-10-dollar-mission.png', {
        type: 'image/png',
      });
      if (
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator
          .share({ files: [file], text: shareText })
          .catch(() => undefined);
      } else {
        downloadBlob(blob, 'the-10-dollar-mission.png');
      }
    });

  return (
    <div className="my-2 w-full max-w-[600px]">
      <div className="mb-2 flex items-center gap-1.5">
        <ViewChip active={view === 'image'} onClick={() => setView('image')}>
          Image
        </ViewChip>
        <ViewChip active={view === 'text'} onClick={() => setView('text')}>
          Text
        </ViewChip>
      </div>

      <div className="relative grid">
        {cards.map((card, index) => {
          const visible = view === 'image' && index === colorIndex;
          return (
            <img
              key={card.id}
              src={pngCacheRef.current.get(card.svg) ?? card.dataUri}
              alt={
                visible
                  ? 'Referral card: go to activepieces.com, say the phrase in the chat, and get $10 in credits'
                  : ''
              }
              aria-hidden={!visible}
              className={cn(
                'col-start-1 row-start-1 w-full rounded-xl ring-1 ring-border/50 transition-opacity duration-200 ease-out',
                !visible && 'pointer-events-none opacity-0',
              )}
            />
          );
        })}
        <div
          aria-hidden={view !== 'text'}
          className={cn(
            'col-start-1 row-start-1 flex aspect-[1200/630] w-full items-center rounded-xl bg-muted/50 p-6 ring-1 ring-border/50 transition-opacity duration-200 ease-out',
            view !== 'text' && 'pointer-events-none opacity-0',
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {shareText}
          </p>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {view === 'image' ? (
            <>
              <OverlayIconButton
                label={copiedImage ? 'Copied' : 'Copy image'}
                onClick={copyImage}
                disabled={busyImage}
              >
                {copiedImage ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </OverlayIconButton>
              <OverlayIconButton
                label="Download image"
                onClick={downloadImage}
                disabled={busyImage}
              >
                <Download className="size-4" />
              </OverlayIconButton>
              <OverlayIconButton
                label="Share"
                onClick={shareImage}
                disabled={busyImage}
              >
                <Share2 className="size-4" />
              </OverlayIconButton>
            </>
          ) : (
            <>
              <OverlayIconButton
                label={copiedText ? 'Copied' : 'Copy text'}
                onClick={copyText}
              >
                {copiedText ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </OverlayIconButton>
              <OverlayIconButton label="Share" onClick={shareTextNative}>
                <Share2 className="size-4" />
              </OverlayIconButton>
            </>
          )}
        </div>
      </div>

      <div
        aria-hidden={view !== 'image'}
        className={cn(
          'mt-3 flex h-8 items-center gap-2 transition-opacity duration-200 ease-out',
          view !== 'image' && 'pointer-events-none opacity-0',
        )}
      >
        {cards.map((color, index) => (
          <button
            key={color.id}
            type="button"
            aria-label={`${color.name} card`}
            tabIndex={view === 'image' ? 0 : -1}
            onClick={() => setColorIndex(index)}
            style={{ backgroundColor: color.bg }}
            className={cn(
              'flex size-6 items-center justify-center rounded-full ring-1 ring-inset ring-foreground/15 transition-transform duration-150 ease-out hover:scale-110',
              index === colorIndex && 'scale-110',
            )}
          >
            {index === colorIndex && (
              <Check
                className="size-3.5"
                strokeWidth={3}
                style={{ color: color.fg }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReferralShareCardSkeleton() {
  return (
    <div className="my-2 w-full max-w-[600px]">
      <div className="mb-2 flex items-center gap-1.5">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-16 rounded-full" />
      </div>
      <Skeleton className="aspect-[1200/630] w-full rounded-xl" />
      <div className="mt-3 flex h-8 items-center gap-2">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="size-6 rounded-full" />
        ))}
      </div>
    </div>
  );
}

function ViewChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-9 rounded-full px-4 text-sm transition-colors duration-200',
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function OverlayIconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded-full bg-background/85 text-foreground/70 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );
}

// Written like a real message between friends — casual opener, no shouty caps, no long tracking
// link — so people can copy it as-is without it feeling like spam.
function buildShareText(phrase: string): string {
  return [
    'Hey 👋 say this in the chat at activepieces.com:',
    '',
    `${phrase}`,
    '',
    'we both get $10 in credits when you do 😉',
  ].join('\n');
}

// Case/whitespace differences in how the model re-emits a phrase must not make a card look
// replaced when it wasn't.
function phraseKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapPhrase(phrase: string, maxCharsPerLine: number): string[] {
  const words = phrase.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

// Pick the largest size whose wrap fits its line budget — short phrases stay poster-scale, long
// ones stay inside the stack, nothing truncates or crowds.
function fitPhrase(phrase: string): { lines: string[]; font: number } {
  for (const step of PHRASE_FIT) {
    const lines = wrapPhrase(phrase, step.wrap);
    if (lines.length <= step.max) {
      return { lines, font: step.font };
    }
  }
  const last = PHRASE_FIT[PHRASE_FIT.length - 1];
  return {
    lines: wrapPhrase(phrase, last.wrap).slice(0, last.max),
    font: last.font,
  };
}

function svgDoc(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${inner}</svg>`;
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// PHRASE FIRST: the card opens with the phrase — big, bold, accent, no highlight — then ONE
// instruction statement below at display size. A huge OUTLINED brand mark bleeds off the
// bottom-right corner as an artistic watermark (rendered behind the text).
function buildCardSvg(phrase: string, color: ReferralColor): string {
  const { lines, font } = fitPhrase(phrase);
  const lineH = Math.round(font * 1.08);
  const mx = 64;
  const instrFont = 46;
  const instrLineH = 60;
  const gap = 56;
  const phraseH = font * 0.74 + (lines.length - 1) * lineH;
  const totalH = phraseH + gap + instrFont * 0.74 + instrLineH;
  const top = 84 + (566 - 84 - totalH) / 2;
  const first = Math.round(top + font * 0.74);
  const instrAY = Math.round(
    first + (lines.length - 1) * lineH + gap + instrFont * 0.74,
  );
  const instrBY = instrAY + instrLineH;
  const tspans = lines
    .map(
      (l, i) =>
        `<tspan x="${mx}" dy="${i === 0 ? 0 : lineH}">${escapeXml(l)}</tspan>`,
    )
    .join('');
  return svgDoc(`<rect width="1200" height="630" fill="${color.bg}"/>
  <g transform="translate(870 315)"><path transform="scale(21)" d="${MARK}" fill="none" stroke="${
    color.fg
  }" stroke-opacity="0.28" stroke-width="0.5"/></g>
  <text x="${mx}" y="${first}" font-family="${SANS}" font-size="${font}" font-weight="900" letter-spacing="${
    -font * 0.03
  }" fill="${color.accent}">${tspans}</text>
  <text x="${mx}" y="${instrAY}" font-family="${SANS}" font-size="${instrFont}" font-weight="300" fill="${
    color.fg
  }">Say it in the chat at <tspan font-weight="500">activepieces.com</tspan></text>
  <text x="${mx}" y="${instrBY}" font-family="${SANS}" font-size="${instrFont}" font-weight="300" fill="${
    color.fg
  }">and get <tspan fill="${
    color.accent
  }" font-weight="500">$10</tspan> in credits 😉</text>`);
}

async function svgToPngBlob(svg: string): Promise<Blob> {
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const image = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('svg load failed'));
  });
  image.src = svgUrl;
  await loaded;
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = 1200 * scale;
  canvas.height = 630 * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('canvas unavailable');
  }
  ctx.scale(scale, scale);
  ctx.drawImage(image, 0, 0, 1200, 630);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/png',
    );
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const SANS =
  "-apple-system, 'SF Pro Display', Inter, 'Helvetica Neue', 'Segoe UI', Roboto, Arial, sans-serif";

// Activepieces brand mark (from public/logo.svg); recolored per color scheme.
const MARK =
  'M6.46013 5.81759C5.30809 4.10962 5.75876 1.79113 7.46672 0.639093C9.17469 -0.512944 11.4932 -0.0622757 12.6452 1.64569L20.4261 13.1813C21.5781 14.8893 21.1274 17.2077 19.4195 18.3598C17.7115 19.5118 15.393 19.0611 14.241 17.3532L10.8676 12.3519C10.4339 11.8054 9.55114 11.8905 9.02108 12.4205C8.58152 12.8601 8.43761 13.9846 8.31301 14.9582C8.29474 15.1009 8.27689 15.2405 8.25858 15.3741C8.19097 16.0114 7.97092 16.6418 7.58762 17.2101C6.33511 19.067 3.81375 19.5565 1.95682 18.304C0.0998936 17.0515 -0.390738 14.5304 0.861776 12.6734C1.51136 11.7104 2.50224 11.1151 3.56472 10.9399L3.56322 10.9384C6.63307 10.4932 7.20222 7.02864 6.64041 6.08487L6.46013 5.81759Z';

// The stack centers in 84..566; these tiers keep it inside at every phrase length while the
// phrase stays the biggest element.
const PHRASE_FIT = [
  { font: 108, wrap: 19, max: 1 },
  { font: 88, wrap: 23, max: 2 },
  { font: 70, wrap: 28, max: 3 },
  { font: 54, wrap: 36, max: 3 },
];
