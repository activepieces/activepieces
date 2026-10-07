import { CreatePieceSetRequestBody, PieceSet } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { platformHooks } from '@/hooks/platform-hooks';
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
}: {
  onCreated: (pieceSet: PieceSet) => void;
  onOpenChange: (open: boolean) => void;
}) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const showKey = platform.plan.embeddingEnabled;
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
        keyField: showKey ? 'key' : undefined,
        showKey,
      }),
  });

  const handleSubmit = (data: FormValues) => {
    if (isPending) {
      return;
    }
    form.clearErrors('root.serverError');
    createSet(
      { name: data.name, key: (showKey && data.key) || undefined },
      {
        onSuccess: (pieceSet) => {
          onOpenChange(false);
          onCreated(pieceSet);
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
                <Input {...field} autoFocus placeholder={t('e.g. Sales')} />
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('New {term}', pieceSetTerms.get())}</DialogTitle>
          <DialogDescription>
            {t(
              'A new {term} allows every piece. Narrow it down once it exists.',
              pieceSetTerms.get(),
            )}
          </DialogDescription>
        </DialogHeader>
        <CreatePieceSetForm
          key={open ? 'open' : 'closed'}
          onCreated={onCreated}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
};
