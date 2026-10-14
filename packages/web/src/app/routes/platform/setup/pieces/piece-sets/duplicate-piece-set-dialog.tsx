import { DuplicatePieceSetRequestBody } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { adminLayout } from '@/app/components/admin';
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
import { pieceSetMutations, pieceSetTerms } from '@/features/piece-sets';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { pieceSetFormErrors } from './piece-set-form-errors';

type DuplicatePieceSetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceId: string;
  sourceName: string;
};

const DuplicatePieceSetForm = ({
  onOpenChange,
  onCancel,
  onSavingChange,
  sourceId,
  sourceName,
}: {
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSavingChange: (saving: boolean) => void;
  sourceId: string;
  sourceName: string;
}) => {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof DuplicatePieceSetRequestBody>>({
    resolver: zodResolver(DuplicatePieceSetRequestBody),
    defaultValues: { name: t('{name} copy', { name: sourceName }) },
    mode: 'onChange',
  });

  const { mutate: duplicateSet, isPending } =
    pieceSetMutations.useDuplicatePieceSet({
      onError: (error) => pieceSetFormErrors.show({ form, error }),
    });

  const submitting = useRef(false);
  const finish = () => {
    submitting.current = false;
    onSavingChange(false);
  };
  const handleSubmit = (data: z.infer<typeof DuplicatePieceSetRequestBody>) => {
    if (isPending || submitting.current) {
      return;
    }
    submitting.current = true;
    onSavingChange(true);
    form.clearErrors('root.serverError');
    duplicateSet(
      { id: sourceId, name: data.name },
      {
        onSuccess: (copy) => {
          finish();
          onOpenChange(false);
          navigate(`/platform/pieces/piece-sets/${copy.id}`);
        },
        onError: finish,
      },
    );
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <fieldset disabled={isPending} className="contents">
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
          {form.formState.errors.root?.serverError && (
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
          )}
        </fieldset>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onCancel}
          >
            {t('Cancel')}
          </Button>
          <Button
            {...adminControl(AdminControl.PIECE_SETS_DUPLICATE_SUBMIT)}
            type="submit"
            loading={isPending}
            disabled={!form.formState.isValid}
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
  const [saving, setSaving] = useState(false);
  const changeOpen = (next: boolean) => {
    if (!next && saving) {
      return;
    }
    onOpenChange(next);
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        className={adminLayout.dialog.md}
        showCloseButton={!saving}
      >
        <DialogHeader>
          <DialogTitle>
            {t('Duplicate {term}', pieceSetTerms.get())}
          </DialogTitle>
          <DialogDescription>
            {t(
              'A new {term} starts with the same pieces and actions as {name}.',
              { ...pieceSetTerms.get(), name: sourceName },
            )}
          </DialogDescription>
        </DialogHeader>
        <DuplicatePieceSetForm
          key={open ? 'open' : 'closed'}
          onOpenChange={onOpenChange}
          onCancel={() => changeOpen(false)}
          onSavingChange={setSaving}
          sourceId={sourceId}
          sourceName={sourceName}
        />
      </DialogContent>
    </Dialog>
  );
};
