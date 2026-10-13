import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import {
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
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
import { TOAST_CLEARANCE_VAR, toastInteraction } from '@/lib/toast-interaction';
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
  const [holdingNavigation, setHoldingNavigation] = useState(false);
  const showSave = saveVisible && (!locked || locked.canSaveRest === true);
  const saveNow = () => {
    if (onSave) {
      onSave();
      return;
    }
    rootRef.current?.closest('form')?.requestSubmit();
  };
  const canSave = showSave && (saveEnabled ?? dirty) && !disabled && !saving;
  const visible =
    dirty ||
    saving ||
    Boolean(error) ||
    locked !== undefined ||
    status !== undefined ||
    children !== undefined;
  useSaveShortcut({ rootRef, canSave, onSave: saveNow });
  useToastClearance(rootRef);

  return (
    <div
      ref={rootRef}
      data-slot="save-bar"
      data-dirty={dirty}
      hidden={!visible}
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
          {renderStatus({ status, error, locked, dirty, saving })}
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
      {guardNavigation && (dirty || saving || holdingNavigation) && (
        <NavigationGuard
          standDown={standDown}
          guardSearchChanges={guardSearchChanges}
          dirty={dirty}
          saving={saving}
          onHoldChange={setHoldingNavigation}
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
      if (event.repeat || hasOpenModal(root)) {
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

function useToastClearance(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') {
      return;
    }
    const style = document.documentElement.style;
    const release = toastInteraction.claimClearance();
    const observer = new ResizeObserver(() => {
      style.setProperty(TOAST_CLEARANCE_VAR, `${root.offsetHeight}px`);
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      style.removeProperty(TOAST_CLEARANCE_VAR);
      release();
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

function hasOpenModal(root: HTMLElement): boolean {
  const openModals = document.querySelectorAll(
    '[data-slot="dialog-content"][data-state="open"], [data-slot="sheet-content"][data-state="open"], [data-slot="select-content"][data-state="open"], [role="alertdialog"][data-state="open"]',
  );
  return [...openModals].some((modal) => !modal.contains(root));
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

function LeaveGuard({
  standDown,
  guardSearchChanges,
  dirty,
  saving,
  onHoldChange,
}: NavigationGuardProps) {
  const fallbackStandDown = useRef(false);
  const leaveBlocker = useWarnBeforeLosingChanges({
    hasChanges: dirty || saving,
    standDown: standDown ?? fallbackStandDown,
    blockSearchChanges: guardSearchChanges,
  });
  const blocked = leaveBlocker.state === 'blocked';
  useEffect(() => {
    onHoldChange(blocked);
    if (blocked && !saving && !dirty) {
      leaveBlocker.proceed?.();
    }
  }, [blocked, saving, dirty, leaveBlocker, onHoldChange]);
  useEffect(() => () => onHoldChange(false), [onHoldChange]);
  return (
    <LeaveWithoutSavingDialog
      open={blocked && !saving && dirty}
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
  saving,
}: Pick<SaveBarProps, 'status' | 'error' | 'locked' | 'dirty' | 'saving'>) {
  if (error) {
    return (
      <span className="flex min-w-0 flex-wrap items-start gap-x-4 gap-y-1">
        <span className="flex min-w-0 items-start gap-2 text-sm text-danger-11">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span className="break-words">{error}</span>
        </span>
        {status}
      </span>
    );
  }
  if (status) {
    return status;
  }
  if (locked) {
    return (
      <StatusDot tone="accent" wrap className="text-gray-11">
        {locked.message}
      </StatusDot>
    );
  }
  if (saving) {
    return (
      <StatusDot tone="accent" wrap className="text-gray-11">
        {t('Saving...')}
      </StatusDot>
    );
  }
  if (dirty) {
    return (
      <StatusDot tone="warning" wrap className="text-gray-11">
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
  dirty: boolean;
  saving: boolean;
  onHoldChange: (holding: boolean) => void;
};

export type SaveBarLock = {
  message: ReactNode;
  action: ReactNode;
  canSaveRest?: boolean;
};
