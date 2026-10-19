import { DuplicatePieceSetRequestBody } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { UseMutationResult } from '@tanstack/react-query';
import { t } from 'i18next';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { adminLayout, useAdminAction } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { pieceSetKeys, pieceSetsApi } from '@/features/piece-sets';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { pieceSetName } from './piece-set-name';

type DuplicatePieceSetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceId: string;
  sourceName: string;
};

type DuplicateRequest = { id: string; name: string };

const DuplicatePieceSetForm = ({
  duplicate,
  onCancel,
  sourceId,
  sourceName,
}: {
  duplicate: UseMutationResult<unknown, Error, DuplicateRequest>;
  onCancel: () => void;
  sourceId: string;
  sourceName: string;
}) => {
  const submitting = useRef(false);
  const form = useForm<z.infer<typeof DuplicatePieceSetRequestBody>>({
    resolver: zodResolver(DuplicatePieceSetRequestBody),
    defaultValues: { name: `${sourceName} (Copy)` },
    mode: 'onChange',
  });

  const handleSubmit = (data: z.infer<typeof DuplicatePieceSetRequestBody>) => {
    if (submitting.current) {
      return;
    }
    submitting.current = true;
    duplicate.mutate(
      { id: sourceId, name: data.name },
      {
        onSettled: () => {
          submitting.current = false;
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Name')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={duplicate.isPending}
            onClick={onCancel}
          >
            {t('Cancel')}
          </Button>
          <Button
            {...adminControl(AdminControl.PIECE_SETS_DUPLICATE_SUBMIT)}
            type="submit"
            loading={duplicate.isPending}
          >
            {t('Duplicate')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export const DuplicatePieceSetDialog = ({
  open,
  onOpenChange,
  sourceId,
  sourceName,
}: DuplicatePieceSetDialogProps) => {
  const duplicate = useAdminAction<DuplicateRequest>({
    verb: 'duplicate',
    name: pieceSetName.short(sourceName),
    run: ({ id, name }) => pieceSetsApi.duplicate(id, { name }),
    invalidate: [pieceSetKeys.all],
    onSuccess: () => onOpenChange(false),
  });
  const changeOpen = (next: boolean) => {
    if (!next && duplicate.isPending) {
      return;
    }
    onOpenChange(next);
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        className={adminLayout.dialog.sm}
        showCloseButton={!duplicate.isPending}
      >
        <DialogHeader>
          <DialogTitle>{t('Duplicate Piece Set')}</DialogTitle>
          <DialogDescription>
            {t('The copy starts with the same settings as the original.')}
          </DialogDescription>
        </DialogHeader>
        <DuplicatePieceSetForm
          key={open ? 'open' : 'closed'}
          duplicate={duplicate}
          onCancel={() => changeOpen(false)}
          sourceId={sourceId}
          sourceName={sourceName}
        />
      </DialogContent>
    </Dialog>
  );
};
