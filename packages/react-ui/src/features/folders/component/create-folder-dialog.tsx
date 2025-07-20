import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import {
  QueryObserverResult,
  RefetchOptions,
  useMutation,
} from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { FolderDto } from '@activepieces/shared';

import { foldersApi } from '../lib/folders-api';

type CreateFolderDialogProps = {
  updateSearchParams: (_folderId?: string) => void;
  refetchFolders: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<FolderDto[], Error>>;
  children: React.ReactNode;
};

const CreateFolderFormSchema = Type.Object({
  displayName: Type.String({
    errorMessage: t('Please enter folder name'),
  }),
});

type CreateFolderFormSchema = Static<typeof CreateFolderFormSchema>;

export const CreateFolderDialog = ({
  updateSearchParams,
  refetchFolders,
  children,
}: CreateFolderDialogProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
        displayName: data.displayName,
        projectId: authenticationSession.getProjectId()!,
      });
    },
    onSuccess: (folder) => {
      form.reset();
      setIsDialogOpen(false);
      updateSearchParams(folder.id);
      refetchFolders();
      toast({
        title: t('Added folder successfully'),
      });
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
            toast(INTERNAL_ERROR_TOAST);
            break;
          }
        }
      }
    },
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

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
                onClick={() => setIsDialogOpen(false)}
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
