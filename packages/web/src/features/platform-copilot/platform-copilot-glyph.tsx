import { cn } from '@/lib/utils';

export type CopilotGlyphState = 'idle' | 'thinking' | 'done';

type CopilotGlyphProps = {
  size?: number;
  state?: CopilotGlyphState;
  className?: string;
};

export function CopilotGlyph({
  size = 32,
  state = 'idle',
  className,
}: CopilotGlyphProps) {
  const isThinking = state === 'thinking';
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className={cn(
          'absolute inset-0 rounded-full bg-primary/20 blur-md transition-opacity duration-300',
          isThinking ? 'opacity-100 animate-pulse' : 'opacity-40',
        )}
      />
      <span
        className={cn(
          'absolute inset-0 rounded-full border transition-all duration-300',
          isThinking ? 'border-primary/40 animate-ping' : 'border-transparent',
        )}
      />
      <span
        className={cn(
          'absolute inset-0 rounded-full border border-primary/20',
          isThinking && 'opacity-80',
        )}
      />
      <img
        src="/logo.svg"
        alt=""
        className="relative z-10 object-contain"
        style={{ width: size * 0.64, height: size * 0.64 }}
      />
    </span>
  );
}
