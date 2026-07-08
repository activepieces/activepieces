import { formErrors } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { pieceSetMutations } from '@/features/piece-sets';

const formSchema = z.object({
  name: z.string().min(1, { message: formErrors.required }),
  key: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentName,
      key: currentKey ?? '',
    },
    mode: 'onChange',
  });

  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();

  const handleSubmit = ({ name, key }: FormValues) => {
    updateSet(
      {
        id,
        request: {
          name,
          key: key || null,
        },
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
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Key')}</FormLabel>
              <FormControl>
                <Input placeholder={t('e.g. my-set')} {...field} />
              </FormControl>
              <FormDescription>
                {t('Used in the Embed SDK to assign this set to a project')}
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Edit Piece Set')}</DialogTitle>
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
