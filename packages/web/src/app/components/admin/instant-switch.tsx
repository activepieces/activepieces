import { t } from 'i18next';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Switch } from '@/components/ui/switch';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';
import { cn } from '@/lib/utils';

import { ConfirmDialog, ConfirmDialogProps } from './confirm-dialog';

export function InstantSwitch({
  checked,
  onCheckedChange,
  successMessage,
  errorTitle,
  undo = false,
  confirmBefore,
  blockedReason,
  beforeSave,
  disabled = false,
  controlId,
  id,
  ...aria
}: InstantSwitchProps) {
  const [optimistic, setOptimistic] = useState<OptimisticValue | null>(null);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState<PendingConfirm | null>(null);
  const [lastConfirm, setLastConfirm] = useState<PendingConfirm | null>(null);
  const latestChecked = useRef(checked);
  latestChecked.current = checked;
  const latest = useRef({ blockedReason, confirmBefore, pending: false });
  latest.current = {
    blockedReason,
    confirmBefore,
    pending: latest.current.pending,
  };
  const askFirst = (pendingConfirm: PendingConfirm) => {
    setConfirming(pendingConfirm);
    setLastConfirm(pendingConfirm);
  };
  const undoTo = async (target: boolean) => {
    if (latest.current.pending) {
      throw mutationFeedback.userError(
        t('Wait for the current change to finish, then undo.'),
      );
    }
    if (latest.current.blockedReason) {
      throw mutationFeedback.userError(latest.current.blockedReason);
    }
    const confirm = latest.current.confirmBefore?.(target);
    if (confirm) {
      await new Promise<void>((resolve, reject) =>
        askFirst({
          next: target,
          confirm,
          isUndo: true,
          settle: { resolve, reject },
        }),
      );
      return;
    }
    await save(target, true);
  };
  const shown =
    optimistic !== null && optimistic.base === checked
      ? optimistic.value
      : checked;

  const save = async (next: boolean, isUndo: boolean) => {
    if (latest.current.blockedReason) {
      throw mutationFeedback.userError(latest.current.blockedReason);
    }
    setOptimistic({ value: next, base: latestChecked.current });
    setPending(true);
    latest.current.pending = true;
    try {
      if (beforeSave) {
        await beforeSave(next);
      }
      await onCheckedChange(next);
      setOptimistic(null);
    } catch (error) {
      setOptimistic(null);
      if (!mutationFeedback.wasShown(error)) {
        mutationFeedback.error({
          error,
          title: isUndo
            ? t("Couldn't undo")
            : errorTitle ?? t("Couldn't save changes"),
        });
      }
      throw error;
    } finally {
      setPending(false);
      latest.current.pending = false;
    }
    if (isUndo) {
      return;
    }
    const message = successMessage?.(next) ?? t('Changes saved');
    if (undo) {
      mutationFeedback.undo({
        message,
        onUndo: () => undoTo(!next),
      });
    } else if (successMessage) {
      toast.success(message);
    }
  };

  return (
    <>
      <Switch
        id={id}
        checked={shown}
        disabled={disabled || Boolean(blockedReason)}
        className={cn(pending && 'cursor-progress opacity-60')}
        aria-busy={pending}
        aria-disabled={pending || undefined}
        onCheckedChange={(next) => {
          if (pending) {
            return;
          }
          const confirm = confirmBefore?.(next);
          if (confirm) {
            askFirst({ next, confirm, isUndo: false });
            return;
          }
          save(next, false).catch(() => undefined);
        }}
        {...aria}
        {...adminControl(controlId)}
      />
      {lastConfirm && (
        <ConfirmDialog
          open={confirming !== null}
          onOpenChange={(open) => {
            if (!open) {
              setConfirming(null);
              if (lastConfirm.settle) {
                const cancelled = new Error('Undo cancelled');
                mutationFeedback.markShown(cancelled);
                lastConfirm.settle.reject(cancelled);
                lastConfirm.settle = undefined;
              }
            }
          }}
          {...lastConfirm.confirm}
          onConfirm={async () => {
            await save(lastConfirm.next, lastConfirm.isUndo);
            lastConfirm.settle?.resolve();
            lastConfirm.settle = undefined;
          }}
        />
      )}
    </>
  );
}

type OptimisticValue = { value: boolean; base: boolean };

type PendingConfirm = {
  next: boolean;
  confirm: InstantSwitchConfirm;
  isUndo: boolean;
  settle?: { resolve: () => void; reject: (error: unknown) => void };
};

export type InstantSwitchConfirm = Omit<
  ConfirmDialogProps,
  'onConfirm' | 'open' | 'onOpenChange' | 'children'
>;

export type InstantSwitchProps = {
  checked: boolean;
  onCheckedChange: (next: boolean) => Promise<unknown>;
  successMessage?: (next: boolean) => string;
  errorTitle?: string;
  undo?: boolean;
  confirmBefore?: (next: boolean) => InstantSwitchConfirm | null;
  blockedReason?: string;
  beforeSave?: (next: boolean) => Promise<void>;
  disabled?: boolean;
  controlId?: AdminControl;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
};
