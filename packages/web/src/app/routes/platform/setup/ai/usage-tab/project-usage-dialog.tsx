import { t } from 'i18next';
import { OctagonAlert } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { MockProjectAiUsage } from '../mock/fixtures';

import { ProjectIconTile, usageMath } from './usage-utils';

export function ProjectUsageDialog({
  row,
  onOpenChange,
}: {
  row: MockProjectAiUsage | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={row !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-md flex-col gap-5 overflow-y-auto">
        {row && <DialogBody row={row} />}
      </DialogContent>
    </Dialog>
  );
}

function DialogBody({ row }: { row: MockProjectAiUsage }) {
  const users = topUsers({ row });
  const topUserCredits = users[0]?.credits ?? 1;
  const { ratio, reached } = usageMath({ row });

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <ProjectIconTile name={row.projectName} className="size-8" />
          <div className="flex flex-col gap-0.5 text-left">
            <DialogTitle className="text-base font-semibold tracking-tight">
              {row.projectName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t('AI usage this billing cycle · estimates')}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-lg border bg-card p-3.5">
          <span className="text-xs text-muted-foreground">
            {t('Credits used')}
          </span>
          <span className="text-xl font-semibold tracking-tight tabular-nums">
            {row.creditsUsed.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border bg-card p-3.5">
          <span className="text-xs text-muted-foreground">
            {row.limit === null ? t('Limit') : t('Remaining')}
          </span>
          <span
            className={cn('text-xl font-semibold tracking-tight tabular-nums', {
              'text-destructive': reached,
            })}
          >
            {row.limit === null
              ? t('None')
              : Math.max(row.limit - row.creditsUsed, 0).toLocaleString()}
          </span>
        </div>
      </div>

      {row.limit !== null && (
        <div className="flex flex-col gap-1.5">
          <Progress
            value={Math.min(ratio, 1) * 100}
            className={cn('h-1.5', { '[&>div]:bg-destructive': reached })}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span>
              {t('{percent}% of limit', {
                percent: Math.round(Math.min(ratio, 1) * 100),
              })}
            </span>
            <span>{row.limit.toLocaleString()}</span>
          </div>
          {reached && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <OctagonAlert className="size-3.5 shrink-0" />
              {t('Limit reached — further AI requests are blocked.')}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
        <p className="pb-2 text-sm font-medium">{t('Top users')}</p>
        <div className="flex flex-col divide-y">
          {users.map((user) => (
            <div key={user.name} className="flex items-center gap-3 py-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {initialsOf(user.name)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="truncate text-sm leading-none">{user.name}</p>
                <Progress
                  value={(user.credits / topUserCredits) * 100}
                  className="h-1"
                />
              </div>
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                {user.credits.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t(
          'Numbers are estimates — exact spend lives in each provider’s dashboard.',
        )}
      </p>
    </>
  );
}

function topUsers({
  row,
}: {
  row: MockProjectAiUsage;
}): { name: string; credits: number }[] {
  const seed = seedOf(row.projectId);
  const count = 3 + (seed % 3);
  let remaining = row.creditsUsed;
  return Array.from({ length: count }, (unused, index) => {
    const name = USER_POOL[(seed + index * 3) % USER_POOL.length];
    const share = index === count - 1 ? 1 : 0.55 - index * 0.08;
    const credits = Math.max(Math.round(remaining * share), 1);
    remaining -= credits;
    return { name, credits };
  }).sort((a, b) => b.credits - a.credits);
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function seedOf(value: string): number {
  return [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

const USER_POOL = [
  'Amira Khalil',
  'Jonas Berg',
  'Lina Sato',
  'Omar Haddad',
  'Maya Torres',
  'Felix Wagner',
  'Sara Petrov',
  'Noah Diaz',
];
