import { t } from 'i18next';
import { Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';

import LargeWidgetWrapper from './large-widget-wrapper';

function FlowLockWidget({ lockedBy, takeOver }: FlowLockWidgetProps) {
  return (
    <LargeWidgetWrapper>
      <div className="flex items-center gap-2">
        <Lock className="size-5" />
        <span>
          {t(
            '{name} is editing this flow. Only one person can edit at a time.',
            {
              name: lockedBy.userDisplayName,
            },
          )}
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={takeOver}>
        {t('Take Over')}
      </Button>
    </LargeWidgetWrapper>
  );
}

FlowLockWidget.displayName = 'FlowLockWidget';
export { FlowLockWidget };

type FlowLockWidgetProps = {
  lockedBy: {
    userId: string;
    userDisplayName: string;
  };
  takeOver: () => void;
};
