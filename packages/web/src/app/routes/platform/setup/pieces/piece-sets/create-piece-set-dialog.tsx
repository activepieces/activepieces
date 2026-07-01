import { CreatePieceSetRequestBody } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from '@/components/ui/switch';
import { pieceSetMutations } from '@/features/piece-sets';

const formSchema = CreatePieceSetRequestBody.extend({
  includeNewPieces: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type CreatePieceSetDialogProps = {
  onCreated: () => void;
};

const CreatePieceSetForm = ({
  onCreated,
  onOpenChange,
}: {
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      includeNewPieces: true,
    },
    mode: 'onChange',
  });

  const { mutate: createSet, isPending } =
    pieceSetMutations.useCreatePieceSet();

  const handleSubmit = (data: FormValues) => {
    createSet(data, {
      onSuccess: () => {
        onOpenChange(false);
        onCreated();
      },
    });
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
                <Input {...field} placeholder={t('e.g. Engineering')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="includeNewPieces"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>{t('Include new pieces by default')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? true}
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
            {t('Create')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export const CreatePieceSetDialog = ({
  onCreated,
}: CreatePieceSetDialogProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-1" />
          {t('New Piece Set')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create Piece Set')}</DialogTitle>
        </DialogHeader>
        <CreatePieceSetForm
          key={open ? 'open' : 'closed'}
          onCreated={onCreated}
          onOpenChange={setOpen}
        />
      </DialogContent>
    </Dialog>
  );
};
