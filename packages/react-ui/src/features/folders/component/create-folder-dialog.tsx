import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import {
  QueryObserverResult,
  RefetchOptions,
  useMutation,
} from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
import { internalErrorToast } from '@/components/ui/sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { FolderDto, Permission } from '@activepieces/shared';

import { foldersApi } from '../lib/folders-api';

type CreateFolderDialogProps = {
  updateSearchParams: (_folderId?: string) => void;
  refetchFolders: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<FolderDto[], Error>>;
  className?: string;
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
  className,
}: CreateFolderDialogProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const form = useForm<CreateFolderFormSchema>({
    resolver: typeboxResolver(CreateFolderFormSchema),
  });

  const { checkAccess } = useAuthorization();
  const userHasPermissionToUpdateFolders = checkAccess(Permission.WRITE_FOLDER);
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
      setIsDialogOpen(false);
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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              disabled={!userHasPermissionToUpdateFolders}
              size="icon"
              className={cn(className)}
            >
              <FolderPlus />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">{t('New folder')}</TooltipContent>
      </Tooltip>

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
