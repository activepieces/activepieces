import { DuplicatePieceSetRequestBody } from '@activepieces/shared';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { pieceSetMutations } from '@/features/piece-sets';

type DuplicatePieceSetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceId: string;
  sourceName: string;
};

const DuplicatePieceSetForm = ({
  onOpenChange,
  sourceId,
  sourceName,
}: {
  onOpenChange: (open: boolean) => void;
  sourceId: string;
  sourceName: string;
}) => {
  const form = useForm<z.infer<typeof DuplicatePieceSetRequestBody>>({
    resolver: zodResolver(DuplicatePieceSetRequestBody),
    defaultValues: { name: `${sourceName} (Copy)` },
    mode: 'onChange',
  });

  const { mutate: duplicateSet, isPending } =
    pieceSetMutations.useDuplicatePieceSet();

  const handleSubmit = (data: z.infer<typeof DuplicatePieceSetRequestBody>) => {
    duplicateSet(
      { id: sourceId, name: data.name },
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
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isPending}>
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Duplicate Piece Set')}</DialogTitle>
        </DialogHeader>
        <DuplicatePieceSetForm
          key={open ? 'open' : 'closed'}
          onOpenChange={onOpenChange}
          sourceId={sourceId}
          sourceName={sourceName}
        />
      </DialogContent>
    </Dialog>
  );
};
