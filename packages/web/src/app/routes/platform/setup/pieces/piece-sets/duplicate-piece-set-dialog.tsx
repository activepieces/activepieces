import { DuplicatePieceSetRequestBody } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { pieceSetMutations } from '@/features/piece-sets';
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
  sourceId,
  sourceName,
}: {
  onOpenChange: (open: boolean) => void;
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

  const handleSubmit = (data: z.infer<typeof DuplicatePieceSetRequestBody>) => {
    if (isPending) {
      return;
    }
    form.clearErrors('root.serverError');
    duplicateSet(
      { id: sourceId, name: data.name },
      {
        onSuccess: (copy) => {
          onOpenChange(false);
          navigate(`/platform/pieces/policies/${copy.id}`);
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Duplicate policy')}</DialogTitle>
          <DialogDescription>
            {t(
              'A new policy starts with the same pieces and actions as {name}.',
              {
                name: sourceName,
              },
            )}
          </DialogDescription>
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
