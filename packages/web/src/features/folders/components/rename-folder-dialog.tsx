import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';

import { foldersMutations } from '../hooks/folders-hooks';

const RenameFolderFormSchema = Type.Object({
  displayName: Type.String({
    errorMessage: t('Please enter folder name'),
    pattern: '.*\\S.*',
  }),
});

type RenameFolderFormSchema = Static<typeof RenameFolderFormSchema>;

export const RenameFolderDialog = ({
  folderId,
  refetchFolders,
  open,
  onOpenChange,
}: RenameFolderDialogProps) => {
  const form = useForm<RenameFolderFormSchema>({
    resolver: typeboxResolver(RenameFolderFormSchema),
  });

  const { mutate, isPending } = foldersMutations.useRenameFolder({
    onSuccess: () => {
      form.reset();
      onOpenChange(false);
      refetchFolders();
      toast.success(t('Folder renamed successfully'));
    },
    onError: (error) => {
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.Conflict: {
            form.setError('root.serverError', {
              message: t('The folder name already exists.'),
            });
            break;
          }
          default: {
            internalErrorToast();
            break;
          }
        }
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Rename Folder')}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              mutate({ folderId, displayName: data.displayName }),
            )}
          >
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <Input
                    {...field}
                    required
                    id="folder"
                    placeholder={t('Folder Name')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <DialogFooter>
              <Button
                variant={'outline'}
                onClick={() => onOpenChange(false)}
                type="button"
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={isPending}>
                {t('Confirm')}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

type RenameFolderDialogProps = {
  folderId: string;
  refetchFolders: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
