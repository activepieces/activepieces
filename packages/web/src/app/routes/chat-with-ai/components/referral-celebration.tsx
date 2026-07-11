import confetti from 'canvas-confetti';
import { t } from 'i18next';
import { RotateCcw } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';

import { colorForPhrase, ReferralColor } from './referral-theme';

// A show plays automatically only once per part per browser session; ids are marked when the show
// finishes (not on mount) so StrictMode's dev double-mount can't suppress the first play.
const playedCelebrationIds = new Set<string>();

// Snappy ~7s beat: the scene drifts in (Ken Burns) while the phrase lands clause-by-clause, then the
// scene darkens and the reward blooms.
const PLAY_MS = 4_800;
const CAMERA_MS = 6_800;
const FINALE_MS = 1_700;
const FADE_MS = 450;

export function ReferralCelebrationCard({
  data,
  toolCallId,
  autoPlay,
}: {
  data: ReferralCelebrationData;
  toolCallId: string;
  autoPlay: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const outcome =
    data.outcome === 'self_referral' ? 'self_referral' : 'released';
  const phrase = typeof data.phrase === 'string' ? data.phrase : '';
  const amountUsd = typeof data.amountUsd === 'number' ? data.amountUsd : 10;
  const heroImageUrl =
    typeof data.heroImageUrl === 'string' ? data.heroImageUrl : undefined;
  const color = useMemo(() => colorForPhrase(phrase), [phrase]);

  const [playing, setPlaying] = useState(
    () => autoPlay && !reducedMotion && !playedCelebrationIds.has(toolCallId),
  );

  const handleDone = useCallback(() => {
    playedCelebrationIds.add(toolCallId);
    setPlaying(false);
  }, [toolCallId]);

  const title =
    outcome === 'released'
      ? t('You said the magic words!')
      : t("That's your own secret phrase 😄");
  const subtitle =
    outcome === 'released'
      ? t('{amount} in AI credits just landed in your account 🎉', {
          amount: `$${amountUsd}`,
        })
      : t('You just previewed the show your friends will get — go share it');

  return (
    <>
      <div className="flex max-w-md items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt=""
            className="size-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="shrink-0 text-2xl leading-none" aria-hidden>
            🎬
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {!reducedMotion && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1.5 text-muted-foreground"
            onClick={() => setPlaying(true)}
          >
            <RotateCcw className="size-3.5" />
            {t('Replay')}
          </Button>
        )}
      </div>
      {createPortal(
        <AnimatePresence>
          {playing && (
            <CelebrationShow
              key={`${toolCallId}-show`}
              phrase={phrase}
              heroImageUrl={heroImageUrl}
              color={color}
              outcome={outcome}
              amountUsd={amountUsd}
              onDone={handleDone}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function CelebrationShow({
  phrase,
  heroImageUrl,
  color,
  outcome,
  amountUsd,
  onDone,
}: {
  phrase: string;
  heroImageUrl?: string;
  color: ReferralColor;
  outcome: CelebrationOutcome;
  amountUsd: number;
  onDone: () => void;
}) {
  const [beat, setBeat] = useState<'play' | 'finale' | 'out'>('play');
  const [imageFailed, setImageFailed] = useState(false);
  const doneRef = useRef(false);
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  const seed = useMemo(() => phraseSeed(phrase), [phrase]);
  const clauses = useMemo(() => splitPhraseClauses(phrase), [phrase]);
  const confettiColors = useMemo(() => paletteConfetti(color), [color]);
  const pan = useMemo(() => cameraPan(seed), [seed]);
  const hasImage = Boolean(heroImageUrl) && !imageFailed;

  useEffect(() => {
    const timers = [
      window.setTimeout(() => {
        setBeat('finale');
        // One soft, low sprinkle in the palette — a whisper of celebration, not a party.
        void confetti({
          particleCount: 42,
          spread: 62,
          startVelocity: 30,
          gravity: 0.85,
          ticks: 200,
          origin: { x: 0.5, y: 0.5 },
          colors: confettiColors,
          zIndex: 10_000,
          scalar: 0.9,
        });
      }, PLAY_MS),
      window.setTimeout(() => setBeat('out'), PLAY_MS + FINALE_MS),
      window.setTimeout(finish, PLAY_MS + FINALE_MS + FADE_MS),
    ];
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [finish, confettiColors]);

  const showFinale = beat === 'finale' || beat === 'out';
  const textColor = hasImage ? '#ffffff' : color.fg;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex cursor-pointer items-center justify-center overflow-hidden"
      style={{ backgroundColor: color.bg }}
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: beat === 'out' ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onClick={finish}
    >
      {/* The scene: the generated hero image with a slow cinematic drift, or a palette gradient. */}
      {hasImage ? (
        <motion.img
          src={heroImageUrl}
          alt={phrase}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          onError={() => setImageFailed(true)}
          initial={{ scale: 1.01, x: 0, y: 0 }}
          animate={{ scale: 1.055, x: pan.x, y: pan.y }}
          transition={{ duration: CAMERA_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${
              color.bg
            }, ${shade(color.bg, -0.12)})`,
          }}
        />
      )}

      {/* Legibility scrim (bottom) + finale darken/blur so the reward reads. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${hexA(
            '#000000',
            hasImage ? 0.66 : 0.28,
          )}, transparent 58%)`,
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: '#000', backdropFilter: 'blur(3px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showFinale ? (hasImage ? 0.5 : 0.28) : 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* The phrase — the other half of the joke — lands clause-by-clause over the scene. */}
      <motion.div
        className="pointer-events-none absolute left-0 right-0 flex flex-col gap-0.5 px-[clamp(20px,5vw,72px)]"
        style={{ bottom: 'clamp(28px, 8vh, 84px)' }}
        animate={{ opacity: showFinale ? 0 : 1, y: showFinale ? -16 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {clauses.map((clause, i) => (
          <motion.span
            key={`${clause}-${i}`}
            className="font-semibold leading-[1.1] tracking-tight"
            style={{
              color: textColor,
              fontSize: 'clamp(1.5rem, 3.6vw, 3rem)',
              textShadow: hasImage ? '0 1px 18px rgba(0,0,0,0.5)' : 'none',
            }}
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              delay:
                0.4 +
                (i / Math.max(clauses.length, 1)) * (PLAY_MS / 1000) * 0.6,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {clause}
          </motion.span>
        ))}
      </motion.div>

      <AnimatePresence>
        {showFinale && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {outcome === 'released' ? (
              <>
                <motion.p
                  className="font-bold tracking-tight"
                  style={{
                    color: hasImage ? '#FFE9B8' : color.accent,
                    fontSize: 'clamp(4rem, 11vw, 7.5rem)',
                    textShadow: '0 4px 30px rgba(0,0,0,0.45)',
                  }}
                  initial={{ scale: 0.86, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {`$${amountUsd}`}
                </motion.p>
                <motion.div
                  className="rounded-full border font-medium"
                  style={{
                    color: '#fff',
                    borderColor: hexA('#ffffff', 0.35),
                    backgroundColor: hexA('#ffffff', 0.12),
                    fontSize: 'clamp(1rem, 2.6vw, 1.5rem)',
                    padding: '0.5rem 1.25rem',
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38 }}
                >
                  {t('added to your AI credits 🎉')}
                </motion.div>
              </>
            ) : (
              <>
                <motion.p
                  className="font-bold tracking-tight"
                  style={{
                    color: hasImage ? '#FFE9B8' : color.accent,
                    fontSize: 'clamp(2.6rem, 8vw, 5.5rem)',
                    textShadow: '0 4px 30px rgba(0,0,0,0.45)',
                  }}
                  initial={{ scale: 0.86, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {t('It works! ✨')}
                </motion.p>
                <motion.div
                  className="font-light"
                  style={{
                    color: '#fff',
                    fontSize: 'clamp(1.1rem, 3vw, 1.9rem)',
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38 }}
                >
                  {t("This one's yours to share")}
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Split a phrase into 2–3 natural clauses so the words land in time with the scene. Breaks before a
// linking word (inside / to / and …) or after a comma; falls back to even word groups.
function splitPhraseClauses(phrase: string): string[] {
  const clean = phrase.trim().replace(/\s+/g, ' ');
  if (clean.length === 0) return [];
  const words = clean.split(' ');
  const boundary = new Set([
    'inside',
    'into',
    'in',
    'onto',
    'on',
    'atop',
    'under',
    'below',
    'beneath',
    'over',
    'above',
    'around',
    'to',
    'for',
    'through',
    'with',
    'and',
    'then',
  ]);
  const chunks: string[] = [];
  let current: string[] = [];
  words.forEach((word, i) => {
    const bare = word.toLowerCase().replace(/[^a-z]/g, '');
    if (current.length > 0 && i > 0 && boundary.has(bare)) {
      chunks.push(current.join(' '));
      current = [word];
    } else {
      current.push(word);
      if (/[,;]$/.test(word)) {
        chunks.push(current.join(' '));
        current = [];
      }
    }
  });
  if (current.length > 0) chunks.push(current.join(' '));
  const clauses = chunks.filter((c) => c.trim().length > 0);
  if (clauses.length >= 2 && clauses.length <= 3) return clauses;
  const groups = Math.min(3, Math.max(2, Math.round(words.length / 4)));
  const size = Math.ceil(words.length / groups);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    out.push(words.slice(i, i + size).join(' '));
  }
  return out.filter((c) => c.length > 0);
}

function cameraPan(seed: number): { x: number; y: number } {
  const dirs = [
    { x: -16, y: -10 },
    { x: 16, y: -10 },
    { x: -16, y: 10 },
    { x: 16, y: 10 },
  ];
  return dirs[seed % dirs.length];
}

function paletteConfetti(color: ReferralColor): string[] {
  return [color.accent, '#FFE9B8', hexA(color.accent, 0.7), '#ffffff'];
}

function phraseSeed(phrase: string): number {
  let hash = 0;
  for (let i = 0; i < phrase.length; i++) {
    hash = (hash * 31 + phrase.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function hexA(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shade(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const adj = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + 255 * amount)));
  return `rgb(${adj(r)}, ${adj(g)}, ${adj(b)})`;
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

type CelebrationOutcome = 'released' | 'self_referral';

export type ReferralCelebrationData = {
  outcome?: string;
  phrase?: string;
  amountUsd?: number;
  heroImageUrl?: string;
};
