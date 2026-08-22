import { t } from 'i18next';
import { Info, Link2, Sparkle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PieceIcon } from '@/features/pieces';
import { cn } from '@/lib/utils';

function ConnectAccountHero({
  displayName,
  logoUrl,
  disabled,
  onConnect,
}: ConnectAccountHeroProps) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold text-foreground">
          {t('Connect your {piece} account', { piece: displayName })}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('Connect your account to continue setting up this step.')}
        </p>
      </div>

      <div className="relative flex size-[168px] items-center justify-center">
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 rounded-full border-2 border-dashed border-primary/25',
            'animate-[spin_18s_linear_infinite] motion-reduce:animate-none',
          )}
        />
        <span
          aria-hidden
          className="absolute size-[104px] rounded-full bg-primary/10 blur-2xl animate-pulse motion-reduce:animate-none"
        />
        {SPARKLES.map((sparkle) => (
          <Sparkle
            key={sparkle.className}
            aria-hidden
            className={cn(
              'absolute fill-primary/70 text-primary/70 animate-pulse motion-reduce:animate-none',
              sparkle.className,
            )}
            style={{ animationDelay: sparkle.delay }}
          />
        ))}
        <PieceIcon
          logoUrl={logoUrl}
          displayName={displayName}
          showTooltip={false}
          border={false}
          size="xxl"
        />
      </div>

      <Button type="button" disabled={disabled} onClick={onConnect}>
        <Link2 className="size-4" />
        {t('Connect {piece}', { piece: displayName })}
      </Button>

      <div className="flex w-full items-start gap-2.5 rounded-lg border border-primary/15 bg-primary/5 p-3 text-left">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(
            'You will be asked for the credentials this piece needs. Only the permissions required to run this step are requested.',
          )}
        </p>
      </div>
    </div>
  );
}

ConnectAccountHero.displayName = 'ConnectAccountHero';

const SPARKLES = [
  { className: 'left-2 top-6 size-3.5', delay: '0ms' },
  { className: 'right-3 top-10 size-2.5', delay: '450ms' },
  { className: 'bottom-8 left-6 size-2.5', delay: '900ms' },
  { className: 'bottom-5 right-7 size-3', delay: '1350ms' },
];

export { ConnectAccountHero };

type ConnectAccountHeroProps = {
  displayName: string;
  logoUrl?: string;
  disabled: boolean;
  onConnect: () => void;
};
