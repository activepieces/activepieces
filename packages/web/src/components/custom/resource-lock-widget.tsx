import { LockerKind } from '@activepieces/shared';
import { t } from 'i18next';
import { Lock, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

function ResourceLockWidget({
  lockedBy,
  takeOver,
  resourceLabel,
}: ResourceLockWidgetProps) {
  const isAi = lockedBy.lockerKind === LockerKind.AI;

  if (isAi) {
    return (
      <div className="absolute top-2.5 z-40 w-full flex justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 py-1 pl-2 pr-2.5 text-xs font-medium text-primary shadow-sm backdrop-blur-sm animate-fade duration-300">
          <Sparkles className="size-3.5 animate-pulse" />
          <span>{t('Chat is working…')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-[12px] z-40 w-full px-2 flex justify-center">
      <div className="py-1.5 px-3.5 border min-h-11.5 border-border bg-background z-40 w-full animate animate-fade duration-300 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="size-5" />
          <span>
            {t(
              '{name} is editing this {resource}. Only one person can edit at a time.',
              {
                name: lockedBy.userDisplayName,
                resource: resourceLabel,
              },
            )}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={takeOver}>
          {t('Take Over')}
        </Button>
      </div>
    </div>
  );
}

ResourceLockWidget.displayName = 'ResourceLockWidget';
export { ResourceLockWidget };

type ResourceLockWidgetProps = {
  lockedBy: {
    userId: string;
    userDisplayName: string;
    lockerKind?: LockerKind;
  };
  takeOver: () => void;
  resourceLabel: string;
};
