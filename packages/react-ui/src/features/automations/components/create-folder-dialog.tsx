import { FolderDto  } from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
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
import { foldersApi } from '@/features/folders/lib/folders-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

type CreateFolderDialogProps = {
  updateSearchParams: (_folderId?: string) => void;
  refetchFolders: () => void;
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CreateFolderFormSchema = Type.Object({
  displayName: Type.String({
    errorMessage: t('Please enter folder name'),
    pattern: '.*\\S.*',
  }),
});

type CreateFolderFormSchema = Static<typeof CreateFolderFormSchema>;

export const CreateFolderDialog = ({
  updateSearchParams,
  refetchFolders,
  open,
  onOpenChange,
}: CreateFolderDialogProps) => {
  const form = useForm<CreateFolderFormSchema>({
    resolver: typeboxResolver(CreateFolderFormSchema),
  });

  const { mutate, isPending } = useMutation<
    FolderDto,
    Error,
    CreateFolderFormSchema
  >({
    mutationFn: async (data) => {
      return await foldersApi.create({
        displayName: data.displayName.trim(),
        projectId: authenticationSession.getProjectId()!,
      });
    },
    onSuccess: (folder) => {
      form.reset();
      onOpenChange(false);
      updateSearchParams(folder.id);
      refetchFolders();
      toast.success(t('Added folder successfully'));
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
          <DialogTitle>{t('New Folder')}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit((data) => mutate(data))}>
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
