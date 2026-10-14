import { CreatePieceSetRequestBody, PieceSet } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { pieceSetMutations, pieceSetTerms } from '@/features/piece-sets';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { pieceSetFormErrors } from './piece-set-form-errors';

const formSchema = CreatePieceSetRequestBody;

type FormValues = z.infer<typeof formSchema>;

type CreatePieceSetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (pieceSet: PieceSet) => void;
};

const CreatePieceSetForm = ({
  onCreated,
  onOpenChange,
  onCancel,
  onSavingChange,
}: {
  onCreated: (pieceSet: PieceSet) => void;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSavingChange: (saving: boolean) => void;
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      key: '',
    },
    mode: 'onChange',
  });

  const { mutate: createSet, isPending } = pieceSetMutations.useCreatePieceSet({
    onError: (error) =>
      pieceSetFormErrors.show({
        form,
        error,
        keyField: 'key',
      }),
  });

  const submitting = useRef(false);
  const finish = () => {
    submitting.current = false;
    onSavingChange(false);
  };
  const handleSubmit = (data: FormValues) => {
    if (isPending || submitting.current) {
      return;
    }
    submitting.current = true;
    onSavingChange(true);
    form.clearErrors('root.serverError');
    createSet(
      { name: data.name, key: data.key || undefined },
      {
        onSuccess: (pieceSet) => {
          finish();
          onOpenChange(false);
          onCreated(pieceSet);
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
                  <Input {...field} autoFocus placeholder={t('e.g. Sales')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Embed key (optional)')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('e.g. sales')} />
                </FormControl>
                <FormDescription>
                  {t(
                    'The embed SDK passes this key to put a project on this {term}. Leave it empty to make one from the name.',
                    pieceSetTerms.get(),
                  )}
                </FormDescription>
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
            {...adminControl(AdminControl.PIECE_SETS_CREATE_SUBMIT)}
            type="submit"
            loading={isPending}
            disabled={!form.formState.isValid}
          >
            {t('Create')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export const CreatePieceSetDialog = ({
  open,
  onOpenChange,
  onCreated,
}: CreatePieceSetDialogProps) => {
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
          <DialogTitle>{t('New {term}', pieceSetTerms.get())}</DialogTitle>
          <DialogDescription>
            {t(
              'A new {term} shows every piece. Hide the ones its projects should not use once it exists.',
              pieceSetTerms.get(),
            )}
          </DialogDescription>
        </DialogHeader>
        <CreatePieceSetForm
          key={open ? 'open' : 'closed'}
          onCreated={onCreated}
          onOpenChange={onOpenChange}
          onCancel={() => changeOpen(false)}
          onSavingChange={setSaving}
        />
      </DialogContent>
    </Dialog>
  );
};
