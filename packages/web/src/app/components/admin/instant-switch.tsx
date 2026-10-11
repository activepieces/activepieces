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
      return;
    }
    if (latest.current.blockedReason) {
      throw mutationFeedback.userError(latest.current.blockedReason);
    }
    const confirm = latest.current.confirmBefore?.(target);
    if (confirm) {
      askFirst({ next: target, confirm, isUndo: true });
      return;
    }
    await save(target, true);
  };
  const shown =
    optimistic !== null && optimistic.base === checked
      ? optimistic.value
      : checked;

  const save = async (next: boolean, isUndo: boolean) => {
    setOptimistic({ value: next, base: latestChecked.current });
    setPending(true);
    latest.current.pending = true;
    try {
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
            }
          }}
          {...lastConfirm.confirm}
          onConfirm={() => save(lastConfirm.next, lastConfirm.isUndo)}
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
  disabled?: boolean;
  controlId?: AdminControl;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
};
