import { formErrors } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { adminLayout } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { pieceSetFormErrors } from './piece-set-form-errors';

type EditPieceSetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  currentName: string;
  currentKey: string | null;
};

const EditPieceSetForm = ({
  onOpenChange,
  id,
  currentName,
  currentKey,
}: {
  onOpenChange: (open: boolean) => void;
  id: string;
  currentName: string;
  currentKey: string | null;
}) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const showKey = platform.plan.embeddingEnabled;
  const form = useForm<FormValues>({
    resolver: zodResolver(
      showKey && currentKey !== null ? formSchemaWithKey : formSchema,
    ),
    defaultValues: {
      name: currentName,
      key: currentKey ?? '',
    },
    mode: 'onChange',
  });

  const { mutate: updateSet, isPending } = pieceSetMutations.useUpdatePieceSet({
    onError: (error) =>
      pieceSetFormErrors.show({
        form,
        error,
        keyField: showKey ? 'key' : undefined,
        showKey,
      }),
  });

  const handleSubmit = ({ name, key }: FormValues) => {
    if (isPending || !form.formState.isDirty) {
      return;
    }
    form.clearErrors('root.serverError');
    updateSet(
      {
        id,
        request: showKey && key !== '' ? { name, key } : { name },
      },
      { onSuccess: () => onOpenChange(false) },
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
        {showKey && (
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Embed key')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('e.g. sales')} {...field} />
                </FormControl>
                <FormDescription>
                  {t(
                    'The embed SDK passes this key to put a project on this {term}.',
                    pieceSetTerms.get(),
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {form.formState.errors.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            {...adminControl(AdminControl.PIECE_SETS_SAVE_SUBMIT)}
            type="submit"
            loading={isPending}
            disabled={!form.formState.isDirty || !form.formState.isValid}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export const EditPieceSetDialog = ({
  open,
  onOpenChange,
  id,
  currentName,
  currentKey,
}: EditPieceSetDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={adminLayout.dialog.md}>
        <DialogHeader>
          <DialogTitle>{t('Edit details')}</DialogTitle>
        </DialogHeader>
        <EditPieceSetForm
          key={open ? 'open' : 'closed'}
          onOpenChange={onOpenChange}
          id={id}
          currentName={currentName}
          currentKey={currentKey}
        />
      </DialogContent>
    </Dialog>
  );
};

const formSchema = z.object({
  name: z.string().trim().min(1, { message: formErrors.required }),
  key: z.string().trim(),
});

const formSchemaWithKey = formSchema.extend({
  key: z.string().trim().min(1, { message: formErrors.required }),
});

type FormValues = z.infer<typeof formSchema>;
