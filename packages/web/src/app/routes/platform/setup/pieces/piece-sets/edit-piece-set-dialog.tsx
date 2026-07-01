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
import { Switch } from '@/components/ui/switch';
import { pieceSetMutations } from '@/features/piece-sets';

const formSchema = z.object({
  name: z.string().min(1, { message: formErrors.required }),
  externalId: z.string().optional(),
  includeNewPieces: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type EditPieceSetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  currentName: string;
  currentExternalId: string | null;
  currentIncludeNewPieces: boolean;
};

const EditPieceSetForm = ({
  onOpenChange,
  id,
  currentName,
  currentExternalId,
  currentIncludeNewPieces,
}: {
  onOpenChange: (open: boolean) => void;
  id: string;
  currentName: string;
  currentExternalId: string | null;
  currentIncludeNewPieces: boolean;
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentName,
      externalId: currentExternalId ?? '',
      includeNewPieces: currentIncludeNewPieces,
    },
    mode: 'onChange',
  });

  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();

  const handleSubmit = ({ name, externalId, includeNewPieces }: FormValues) => {
    updateSet(
      {
        id,
        request: {
          name,
          externalId: externalId || null,
          includeNewPieces,
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
          name="externalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('External ID')}</FormLabel>
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
        <FormField
          control={form.control}
          name="includeNewPieces"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-4">
              <div>
                <FormLabel>{t('Include new pieces')}</FormLabel>
                <FormDescription>
                  {t(
                    'Automatically include newly installed pieces in this set',
                  )}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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
  currentExternalId,
  currentIncludeNewPieces,
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
          currentExternalId={currentExternalId}
          currentIncludeNewPieces={currentIncludeNewPieces}
        />
      </DialogContent>
    </Dialog>
  );
};
