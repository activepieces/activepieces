import { t } from 'i18next';
import { Crown } from 'lucide-react';
import { createContext, ReactNode, useContext } from 'react';

import { FeatureTier, TIER_LABELS } from '@/lib/feature-tier';
import { cn } from '@/lib/utils';

export function FeatureSampleProvider({
  value,
  children,
}: {
  value: FeatureSampleState;
  children: ReactNode;
}) {
  return (
    <FeatureSampleContext.Provider value={value}>
      {children}
    </FeatureSampleContext.Provider>
  );
}

export function SampleTierPill() {
  const { locked, tier } = useContext(FeatureSampleContext);
  if (!locked || tier === undefined) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      <Crown className="size-3" />
      {TIER_LABELS[tier]}
    </span>
  );
}

export function SampleDataNotice({ className }: { className?: string }) {
  const { locked } = useContext(FeatureSampleContext);
  if (!locked) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground',
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
      {t("Sample data · shows what you'll see once enabled")}
    </div>
  );
}

export function useFeatureSample() {
  return useContext(FeatureSampleContext);
}

const FeatureSampleContext = createContext<FeatureSampleState>({
  locked: false,
});

export type FeatureSampleState = {
  locked: boolean;
  tier?: FeatureTier;
  documentationUrl?: string;
};
