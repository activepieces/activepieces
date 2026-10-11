import { t } from 'i18next';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Switch } from '@/components/ui/switch';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { ConfirmDialog, ConfirmDialogProps } from './confirm-dialog';

export function InstantSwitch({
  checked,
  onCheckedChange,
  successMessage,
  errorTitle,
  undo = false,
  confirmBefore,
  disabled = false,
  controlId,
  id,
  ...aria
}: InstantSwitchProps) {
  const [optimistic, setOptimistic] = useState<OptimisticValue | null>(null);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState<PendingConfirm | null>(null);
  const latestChecked = useRef(checked);
  latestChecked.current = checked;
  const shown =
    optimistic !== null && optimistic.base === checked
      ? optimistic.value
      : checked;

  const save = async (next: boolean, isUndo: boolean) => {
    setOptimistic({ value: next, base: latestChecked.current });
    setPending(true);
    try {
      await onCheckedChange(next);
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
    }
    if (isUndo) {
      return;
    }
    const message = successMessage?.(next) ?? t('Changes saved');
    if (undo) {
      mutationFeedback.undo({
        message,
        onUndo: () => save(!next, true),
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
        disabled={disabled || pending}
        aria-busy={pending}
        onCheckedChange={(next) => {
          const confirm = confirmBefore?.(next);
          if (confirm) {
            setConfirming({ next, confirm });
            return;
          }
          save(next, false).catch(() => undefined);
        }}
        {...aria}
        {...adminControl(controlId)}
      />
      {confirming && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setConfirming(null);
            }
          }}
          {...confirming.confirm}
          onConfirm={() => save(confirming.next, false)}
        />
      )}
    </>
  );
}

type OptimisticValue = { value: boolean; base: boolean };

type PendingConfirm = { next: boolean; confirm: InstantSwitchConfirm };

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
  disabled?: boolean;
  controlId?: AdminControl;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
};
