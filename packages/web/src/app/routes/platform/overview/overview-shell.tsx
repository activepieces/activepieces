import { t } from 'i18next';
import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FeatureTier, TIER_LABELS } from '@/features/billing';
import { cn } from '@/lib/utils';

export function AdminOverview({
  title,
  description,
  action,
  children,
}: AdminOverviewProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
      <div className="flex items-start justify-between gap-6 border-b pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-medium">{title}</h1>
          {description !== undefined && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function OverviewCards({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-3 [&>*:only-child]:max-w-60">
      {children}
    </div>
  );
}

export function OverviewCard({
  to,
  title,
  tier,
  value,
  description,
  isLoading = false,
  isError = false,
  errorEntity,
}: OverviewCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-2.5 rounded-lg border bg-background p-4 transition-colors hover:border-ring/40 hover:bg-muted/40"
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate font-medium">{title}</span>
        {tier !== undefined && (
          <Badge variant="outline">{TIER_LABELS[tier]}</Badge>
        )}
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      {isLoading ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <div className="text-2xl font-semibold leading-none tracking-tight">
          {isError ? '—' : value}
        </div>
      )}
      <div className="text-sm text-muted-foreground">
        {isError
          ? t('Trouble loading {entity}', { entity: errorEntity ?? title })
          : description}
      </div>
    </Link>
  );
}

export function OverviewSection({
  title,
  description,
  isLoading = false,
  error,
  children,
}: OverviewSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {description !== undefined && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {error !== undefined ? (
        <div className="rounded-lg border">
          <DataFetchErrorState
            entity={error.entity}
            onRetry={error.onRetry}
            className="py-8"
          />
        </div>
      ) : isLoading ? (
        <Skeleton className="h-24 w-full rounded-lg" />
      ) : (
        children
      )}
    </section>
  );
}

export function OverviewEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-7 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function OverviewRows({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y overflow-hidden rounded-lg border">{children}</div>
  );
}

export function OverviewRow({ tone, label, children }: OverviewRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn('size-2 shrink-0 rounded-full', TONE_CLASS[tone])}
        aria-hidden
      />
      <span className="flex-1 text-sm">{label}</span>
      {children !== undefined && (
        <span className="shrink-0 text-sm text-muted-foreground">
          {children}
        </span>
      )}
    </div>
  );
}

export function OverviewRowLink({ to, children }: OverviewRowLinkProps) {
  return (
    <Link
      to={to}
      className="shrink-0 text-sm font-medium text-primary hover:underline"
    >
      {children ?? t('Review')}
    </Link>
  );
}

const TONE_CLASS: Record<OverviewRowTone, string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  error: 'bg-destructive',
  off: 'bg-muted-foreground/35',
};

export type OverviewRowTone = 'ok' | 'warn' | 'error' | 'off';

export type AdminOverviewProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export type OverviewCardProps = {
  to: string;
  title: string;
  tier?: FeatureTier;
  value: ReactNode;
  description: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorEntity?: string;
};

export type OverviewSectionError = {
  entity: string;
  onRetry?: () => unknown;
};

export type OverviewSectionProps = {
  title: string;
  description?: string;
  isLoading?: boolean;
  error?: OverviewSectionError;
  children: ReactNode;
};

export type OverviewRowProps = {
  tone: OverviewRowTone;
  label: ReactNode;
  children?: ReactNode;
};

export type OverviewRowLinkProps = {
  to: string;
  children?: ReactNode;
};
