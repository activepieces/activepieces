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
import { pieceSetMutations } from '@/features/piece-sets';

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
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      key: '',
    },
    mode: 'onChange',
  });

  const { mutate: createSet, isPending } =
    pieceSetMutations.useCreatePieceSet();

  const handleSubmit = (data: FormValues) => {
    createSet(
      { name: data.name, key: data.key || undefined },
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
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Key (optional)')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('e.g. sales')} />
              </FormControl>
              <FormDescription>
                {t('Used by the embed SDK to assign this set.')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isPending}>
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
          <DialogTitle>{t('New piece set')}</DialogTitle>
          <DialogDescription>
            {t(
              'A new set includes every piece. Narrow it down once it exists.',
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
