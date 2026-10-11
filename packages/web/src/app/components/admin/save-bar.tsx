import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import {
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from 'react';
import { UNSAFE_DataRouterContext } from 'react-router-dom';

import {
  LeaveWithoutSavingDialog,
  useWarnBeforeLosingChanges,
} from '@/components/custom/leave-without-saving';
import { Shortcut } from '@/components/custom/shortcut';
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
  guardSearchChanges = false,
  standDown,
  showSave: saveVisible = true,
  saveEnabled,
  announceStatus = true,
  children,
}: SaveBarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const showSave = saveVisible && (!locked || locked.canSaveRest === true);
  const saveNow = () => {
    if (onSave) {
      onSave();
      return;
    }
    rootRef.current?.closest('form')?.requestSubmit();
  };
  const canSave = showSave && (saveEnabled ?? dirty) && !disabled && !saving;
  useSaveShortcut({ rootRef, canSave, onSave: saveNow });

  return (
    <div
      ref={rootRef}
      data-slot="save-bar"
      data-dirty={dirty}
      className={cn(adminSurface.saveBar, 'sticky bottom-0 z-20 mt-auto')}
    >
      <div
        className={cn(
          'flex w-full flex-wrap items-center justify-end gap-2 px-4 py-3 md:px-6',
          width === 'content' && adminLayout.contentWidth,
        )}
      >
        <div
          role={error ? 'alert' : announceStatus ? 'status' : undefined}
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
            disabled={!(saveEnabled ?? dirty) || disabled}
            variant={locked ? 'outline' : 'default'}
          >
            <span className="flex items-center justify-center gap-2">
              {saveLabel ?? t('Save')}
              <span aria-hidden className="pointer-coarse:hidden">
                <Shortcut
                  shortcutKey="s"
                  withCtrl
                  className={cn(!locked && 'text-on-accent/70')}
                />
              </span>
            </span>
          </Button>
        )}
        {locked?.action}
      </div>
      {guardNavigation && dirty && (
        <NavigationGuard
          standDown={standDown}
          guardSearchChanges={guardSearchChanges}
        />
      )}
    </div>
  );
}

function useSaveShortcut({
  rootRef,
  canSave,
  onSave,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  canSave: boolean;
  onSave: () => void;
}) {
  const latest = useRef({ canSave, onSave });
  latest.current = { canSave, onSave };
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    mountedSaveBars.add(root);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSaveShortcut(event)) {
        return;
      }
      event.preventDefault();
      if (hasOpenModal()) {
        return;
      }
      if (latest.current.canSave && ownsShortcut(root)) {
        latest.current.onSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      mountedSaveBars.delete(root);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [rootRef]);
}

function isSaveShortcut(event: KeyboardEvent): boolean {
  if (typeof event.key !== 'string' || event.shiftKey || event.altKey) {
    return false;
  }
  const isMac = /(Mac)/i.test(navigator.userAgent);
  return (
    event.key.toLowerCase() === 's' && (isMac ? event.metaKey : event.ctrlKey)
  );
}

function hasOpenModal(): boolean {
  return (
    document.querySelector(
      '[data-slot="dialog-content"][data-state="open"], [data-slot="sheet-content"][data-state="open"], [role="alertdialog"][data-state="open"]',
    ) !== null
  );
}

function ownsShortcut(root: HTMLElement): boolean {
  const dirtyBars = [...mountedSaveBars].filter(
    (bar) => bar.dataset.dirty === 'true',
  );
  if (dirtyBars.length <= 1) {
    return true;
  }
  const active = document.activeElement;
  const form = active?.closest('form') ?? null;
  return form !== null && form.contains(root);
}

function NavigationGuard(props: NavigationGuardProps) {
  const dataRouter = useContext(UNSAFE_DataRouterContext);
  const id = useId();
  useEffect(() => guardOwners.add(id), [id]);
  const owner = useSyncExternalStore(guardOwners.subscribe, guardOwners.first);
  return dataRouter && owner === id ? <LeaveGuard {...props} /> : null;
}

function createGuardOwners() {
  let owners: string[] = [];
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    add: (id: string) => {
      owners = [...owners, id];
      notify();
      return () => {
        owners = owners.filter((owner) => owner !== id);
        notify();
      };
    },
    first: () => owners[0] ?? null,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function LeaveGuard({ standDown, guardSearchChanges }: NavigationGuardProps) {
  const fallbackStandDown = useRef(false);
  const leaveBlocker = useWarnBeforeLosingChanges({
    hasChanges: true,
    standDown: standDown ?? fallbackStandDown,
    blockSearchChanges: guardSearchChanges,
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

const mountedSaveBars = new Set<HTMLElement>();
const guardOwners = createGuardOwners();

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
  guardSearchChanges?: boolean;
  standDown?: RefObject<boolean>;
  showSave?: boolean;
  saveEnabled?: boolean;
  announceStatus?: boolean;
  children?: ReactNode;
};

type NavigationGuardProps = {
  standDown?: RefObject<boolean>;
  guardSearchChanges: boolean;
};

export type SaveBarLock = {
  message: ReactNode;
  action: ReactNode;
  canSaveRest?: boolean;
};
