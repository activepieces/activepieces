import { t } from 'i18next';
import { Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';

function ResourceLockWidget({
  lockedBy,
  takeOver,
  resourceLabel,
}: ResourceLockWidgetProps) {
  return (
    <div className="absolute top-3 z-40 flex w-full justify-center px-2">
      <div className="z-40 flex min-h-11 w-full animate-fade items-center justify-between rounded-xl border border-gray-6 bg-gray-1 px-3 py-1.5 duration-300">
        <div className="flex items-center gap-2">
          <Lock className="size-4" />
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
  };
  takeOver: () => void;
  resourceLabel: string;
};
