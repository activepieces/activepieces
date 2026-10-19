import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { CircleAlert, TriangleAlert } from 'lucide-react';
import { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { ConfirmFailure, mutationFeedback } from '@/lib/mutation-feedback';

import { adminLayout } from './admin-layout';
import { adminBulk } from './use-admin-action';

export function ConfirmDialog({
  open,
  onOpenChange,
  children,
  ...bodyProps
}: ConfirmDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const [session, setSession] = useState({ open: isOpen, key: 0 });
  if (session.open !== isOpen) {
    setSession({ open: isOpen, key: isOpen ? session.key + 1 : session.key });
  }
  const setOpen = (next: boolean) => {
    if (!next && pending) {
      return;
    }
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className={adminLayout.dialog.sm}
        onClick={(event) => event.stopPropagation()}
        onEscapeKeyDown={(event) => pending && event.preventDefault()}
        onInteractOutside={(event) => pending && event.preventDefault()}
      >
        <ConfirmDialogBody
          key={session.key}
          {...bodyProps}
          onPendingChange={setPending}
          onDone={() => {
            setPending(false);
            if (!isControlled) {
              setUncontrolledOpen(false);
            }
            onOpenChange?.(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialogBody({
  title,
  description,
  consequence,
  confirmLabel,
  destructive = true,
  typeToConfirm,
  successMessage,
  onConfirm,
  controlId,
  onDone,
  onPendingChange,
}: ConfirmDialogBodyProps) {
  const inputId = useId();
  const [typed, setTyped] = useState('');
  const [failure, setFailure] = useState<ConfirmFailure | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      setFailure(null);
      onPendingChange?.(true);
      const failed = await mutationFeedback.runConfirm({
        run: onConfirm,
        canShowInline: () => mounted.current,
      });
      if (failed === null) {
        return;
      }
      if (!mounted.current) {
        throw failed.error;
      }
      if (mutationFeedback.isQuotaExceeded(failed.error)) {
        onDone();
        mutationFeedback.error({ error: failed.error });
      } else {
        setFailure(failed);
      }
      throw failed.error;
    },
    onSettled: () => onPendingChange?.(false),
    onSuccess: () => {
      onDone();
      if (successMessage) {
        toast.success(successMessage);
      }
    },
  });
  const failedItems =
    failure === null ? [] : adminBulk.failureReasons(failure.error);
  const retrying = failedItems.length > 0;
  const typedMatches =
    retrying ||
    typeToConfirm === undefined ||
    typed.trim() === typeToConfirm.trim();
  const confirm = () => {
    if (typedMatches && !isPending) {
      mutate();
    }
  };

  return (
    <>
      <DialogHeader className="min-w-0">
        <DialogTitle className="break-words">{title}</DialogTitle>
        {description && (
          <DialogDescription className="break-words">
            {description}
          </DialogDescription>
        )}
      </DialogHeader>
      {consequence && (
        <Alert variant="warning">
          <TriangleAlert className="size-4" />
          <AlertDescription>{consequence}</AlertDescription>
        </Alert>
      )}
      {typeToConfirm !== undefined && !retrying && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId} className="block font-normal text-gray-11">
            {t('To confirm, type')}{' '}
            <span className="font-medium text-gray-12">{typeToConfirm}</span>
          </Label>
          <Input
            id={inputId}
            value={typed}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                confirm();
              }
            }}
          />
        </div>
      )}
      {failure !== null && (
        <Alert variant="destructive">
          <CircleAlert className="size-4" />
          {failure.title !== undefined && (
            <AlertTitle>{failure.title}</AlertTitle>
          )}
          <AlertDescription>
            {failure.description}
            {retrying && (
              <ul className="mt-1 flex flex-col gap-1">
                {failedItems.map((item, index) => (
                  <li key={`${item.name}-${index}`} className="break-words">
                    {item.name
                      ? t('{name}: {reason}', {
                          name: item.name,
                          reason: item.reason,
                        })
                      : item.reason}
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}
      <DialogFooter className="mt-2">
        <Button variant="outline" disabled={isPending} onClick={onDone}>
          {t('Cancel')}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'default'}
          loading={isPending}
          disabled={!typedMatches}
          onClick={confirm}
          {...adminControl(controlId)}
        >
          {retrying ? t('Retry failed') : confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

type ConfirmDialogBodyProps = {
  title: string;
  description?: ReactNode;
  consequence?: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  typeToConfirm?: string;
  successMessage?: string;
  onConfirm: () => Promise<unknown> | unknown;
  controlId?: AdminControl;
  onDone: () => void;
  onPendingChange?: (pending: boolean) => void;
};

export type ConfirmDialogProps = Omit<
  ConfirmDialogBodyProps,
  'onDone' | 'onPendingChange'
> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};
