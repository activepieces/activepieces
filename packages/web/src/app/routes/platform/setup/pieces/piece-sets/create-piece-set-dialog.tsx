import { CreatePieceSetRequestBody, PieceSet } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { UseMutationResult } from '@tanstack/react-query';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { adminLayout, useAdminAction } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { pieceSetKeys, pieceSetsApi } from '@/features/piece-sets';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { pieceSetName } from './piece-set-name';

const formSchema = CreatePieceSetRequestBody;

type FormValues = z.infer<typeof formSchema>;

type CreatePieceSetDialogProps = {
  onCreated: () => void;
};

const CreatePieceSetForm = ({
  create,
  onCancel,
}: {
  create: UseMutationResult<PieceSet, Error, CreatePieceSetRequestBody>;
  onCancel: () => void;
}) => {
  const submitting = useRef(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  const handleSubmit = (data: FormValues) => {
    if (submitting.current) {
      return;
    }
    submitting.current = true;
    create.mutate(data, {
      onSettled: () => {
        submitting.current = false;
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
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={create.isPending}
            onClick={onCancel}
          >
            {t('Cancel')}
          </Button>
          <Button
            {...adminControl(AdminControl.PIECE_SETS_CREATE_SUBMIT)}
            type="submit"
            loading={create.isPending}
          >
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
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.plan.managePiecesEnabled;
  const [open, setOpen] = useState(false);
  const create = useAdminAction<CreatePieceSetRequestBody, PieceSet>({
    verb: 'create',
    name: (request) => pieceSetName.short(request.name),
    run: (request) => pieceSetsApi.create(request),
    invalidate: [pieceSetKeys.all],
    onSuccess: () => {
      setOpen(false);
      onCreated();
    },
  });
  const changeOpen = (next: boolean) => {
    if (!next && create.isPending) {
      return;
    }
    setOpen(next);
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button
          {...adminControl(AdminControl.PIECE_SETS_CREATE_OPEN)}
          disabled={!isEnabled}
        >
          <Plus />
          {t('New Piece Set')}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={adminLayout.dialog.md}
        showCloseButton={!create.isPending}
      >
        <DialogHeader>
          <DialogTitle>{t('Create Piece Set')}</DialogTitle>
          <DialogDescription>
            {t('Give the new piece set a name.')}
          </DialogDescription>
        </DialogHeader>
        <CreatePieceSetForm
          key={open ? 'open' : 'closed'}
          create={create}
          onCancel={() => changeOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
