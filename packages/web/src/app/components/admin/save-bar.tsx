import { t } from 'i18next';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { adminLayout } from './admin-layout';
import { adminSurface } from './admin-surface';
import { StatusDot } from './status-dot';

export function SaveBar({
  dirty,
  saving,
  disabled = false,
  onSave,
  onDiscard,
  canDiscard,
  saveLabel,
  discardLabel,
  status,
  saveControl,
  locked,
  width = 'full',
  children,
}: SaveBarProps) {
  const showSave = !locked || locked.canSaveRest === true;
  return (
    <div
      data-slot="save-bar"
      className={cn(adminSurface.saveBar, 'sticky bottom-0 z-20 mt-auto')}
    >
      <div
        className={cn(
          'flex w-full flex-wrap items-center justify-end gap-2 px-4 py-3 md:px-6',
          width === 'content' && adminLayout.contentWidth,
        )}
      >
        <div role="status" className="flex min-w-0 flex-1 items-center">
          {status ??
            (locked ? (
              <StatusDot tone="accent" className="text-gray-11">
                {locked.message}
              </StatusDot>
            ) : (
              dirty && (
                <StatusDot tone="warning" className="text-gray-11">
                  {t('You have unsaved changes')}
                </StatusDot>
              )
            ))}
        </div>
        {children}
        {onDiscard && (
          <Button
            type="button"
            variant="outline"
            disabled={!(canDiscard ?? dirty) || saving}
            onClick={onDiscard}
          >
            {discardLabel ?? t('Cancel')}
          </Button>
        )}
        {showSave && (
          <Button
            {...adminControl(saveControl)}
            type={onSave ? 'button' : 'submit'}
            onClick={onSave}
            loading={saving}
            disabled={!dirty || disabled}
            variant={locked ? 'outline' : 'default'}
          >
            {saveLabel ?? t('Save')}
          </Button>
        )}
        {locked?.action}
      </div>
    </div>
  );
}

type SaveBarProps = {
  dirty: boolean;
  saving: boolean;
  disabled?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  canDiscard?: boolean;
  saveLabel?: string;
  discardLabel?: string;
  status?: ReactNode;
  saveControl?: AdminControl;
  locked?: SaveBarLock;
  width?: 'full' | 'content';
  children?: ReactNode;
};

export type SaveBarLock = {
  message: ReactNode;
  action: ReactNode;
  canSaveRest?: boolean;
};
