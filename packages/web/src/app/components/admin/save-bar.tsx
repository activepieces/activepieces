import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { ReactNode, RefObject, useContext, useRef } from 'react';
import { UNSAFE_DataRouterContext } from 'react-router-dom';

import {
  LeaveWithoutSavingDialog,
  useWarnBeforeLosingChanges,
} from '@/components/custom/leave-without-saving';
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
  error,
  saveControl,
  locked,
  width = 'full',
  guardNavigation = true,
  standDown,
  children,
}: SaveBarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const showSave = !locked || locked.canSaveRest === true;
  const saveNow = () => {
    if (onSave) {
      onSave();
      return;
    }
    rootRef.current?.closest('form')?.requestSubmit();
  };

  return (
    <div
      ref={rootRef}
      data-slot="save-bar"
      className={cn(adminSurface.saveBar, 'sticky bottom-0 z-20 mt-auto')}
    >
      <div
        className={cn(
          'flex w-full flex-wrap items-center justify-end gap-2 px-4 py-3 md:px-6',
          width === 'content' && adminLayout.contentWidth,
        )}
      >
        <div
          role={error ? 'alert' : 'status'}
          className="flex min-w-0 flex-1 items-center"
        >
          {renderStatus({ status, error, locked, dirty })}
        </div>
        {children}
        {onDiscard && (
          <Button
            type="button"
            variant="outline"
            disabled={!(canDiscard ?? dirty) || saving}
            onClick={onDiscard}
          >
            {discardLabel ?? t('Discard')}
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
            keyboardShortcut="s"
            onKeyboardShortcut={saveNow}
          >
            {saveLabel ?? t('Save')}
          </Button>
        )}
        {locked?.action}
      </div>
      {guardNavigation && dirty && <NavigationGuard standDown={standDown} />}
    </div>
  );
}

function NavigationGuard({ standDown }: { standDown?: RefObject<boolean> }) {
  const dataRouter = useContext(UNSAFE_DataRouterContext);
  return dataRouter ? <LeaveGuard standDown={standDown} /> : null;
}

function LeaveGuard({ standDown }: { standDown?: RefObject<boolean> }) {
  const fallbackStandDown = useRef(false);
  const leaveBlocker = useWarnBeforeLosingChanges({
    hasChanges: true,
    standDown: standDown ?? fallbackStandDown,
  });
  return (
    <LeaveWithoutSavingDialog
      open={leaveBlocker.state === 'blocked'}
      onKeepEditing={() => leaveBlocker.reset?.()}
      onDiscard={() => leaveBlocker.proceed?.()}
    />
  );
}

function renderStatus({
  status,
  error,
  locked,
  dirty,
}: Pick<SaveBarProps, 'status' | 'error' | 'locked' | 'dirty'>) {
  if (error) {
    return (
      <span className="flex min-w-0 items-start gap-2 text-sm text-danger-11">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <span className="break-words">{error}</span>
      </span>
    );
  }
  if (status) {
    return status;
  }
  if (locked) {
    return (
      <StatusDot tone="accent" className="text-gray-11">
        {locked.message}
      </StatusDot>
    );
  }
  if (dirty) {
    return (
      <StatusDot tone="warning" className="text-gray-11">
        {t('You have unsaved changes')}
      </StatusDot>
    );
  }
  return null;
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
  error?: string | null;
  saveControl?: AdminControl;
  locked?: SaveBarLock;
  width?: 'full' | 'content';
  guardNavigation?: boolean;
  standDown?: RefObject<boolean>;
  children?: ReactNode;
};

export type SaveBarLock = {
  message: ReactNode;
  action: ReactNode;
  canSaveRest?: boolean;
};
