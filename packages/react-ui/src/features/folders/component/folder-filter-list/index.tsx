import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQuery } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import {
  Folder,
  PlusIcon,
} from 'lucide-react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLocation, useSearchParams } from 'react-router-dom';

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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/seperator';
import { Skeleton } from '@/components/ui/skeleton';
import { TextWithIcon } from '@/components/ui/text-with-icon';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { FolderDto } from '@activepieces/shared';

import { foldersApi } from '../../lib/folders-api';
import { foldersHooks } from '../../lib/folders-hooks';
import { foldersUtils } from '../../lib/folders-utils';

import { FolderItem } from '@/features/folders/component/folder-filter-list/folder-item';

const CreateFolderFormSchema = Type.Object({
  displayName: Type.String({
    errorMessage: t('Please enter folder name'),
  }),
});

type CreateFolderFormSchema = Static<typeof CreateFolderFormSchema>;


const FolderFilterList = () => {
  const location = useLocation();

  const [searchParams, setSearchParams] = useSearchParams(location.search);
  const selectedFolderId = searchParams.get('folderId');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const form = useForm<CreateFolderFormSchema>({
    resolver: typeboxResolver(CreateFolderFormSchema),
  });

  const updateSearchParams = (folderId: string | undefined) => {
    const newQueryParameters: URLSearchParams = new URLSearchParams(
      searchParams,
    );
    if (folderId) {
      newQueryParameters.set('folderId', folderId);
    } else {
      newQueryParameters.delete('folderId');
    }
    newQueryParameters.delete('cursor');

    setSearchParams(newQueryParameters);
  };

  const { folders, isLoading, refetch } = foldersHooks.useFolders();

  const { data: allFlowsCount } = useQuery({
    queryKey: ['flowsCount', authenticationSession.getProjectId()],
    queryFn: flowsApi.count,
  });

  const { mutate, isPending } = useMutation<
    FolderDto,
    Error,
    CreateFolderFormSchema
  >({
    mutationFn: async (data) => {
      return await foldersApi.create({
        displayName: data.displayName,
      });
    },
    onSuccess: (folder) => {
      form.reset();
      setIsDialogOpen(false);
      updateSearchParams(folder.id);
      refetch();
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
    <div className="p-2">
      <div className="flex flex-row items-center mb-2">
        <span className="flex">{t('Folders')}</span>
        <div className="grow"></div>
        <div className="flex items-center justify-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost">
                <PlusIcon size={18} />
              </Button>
            </DialogTrigger>
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
                    <Button type="submit" loading={isPending}>
                      {t('Confirm')}
                    </Button>
                  </DialogFooter>
                </form>
              </FormProvider>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex w-[270px] h-full flex-col space-y-1">
    
        <FolderItem
          folderDisplayName={t('All flows')}
          numberOfFlows={foldersUtils.extractUncategorizedFlows(allFlowsCount, folders)}
          refetch={refetch}
          folderId={undefined}
          disableMenu={true}
          selectedFolderId={selectedFolderId}
          updateSearchParams={updateSearchParams}
        />
        <FolderItem
          folderDisplayName={t('Uncategorized')}
          numberOfFlows={foldersUtils.extractUncategorizedFlows(allFlowsCount, folders)}
          folderId="NULL"
          refetch={refetch}
          disableMenu={true}
          selectedFolderId={selectedFolderId}
          updateSearchParams={updateSearchParams}
        />
 
        <Separator className="my-6" />
        <ScrollArea type="auto">
          <div className="flex flex-col w-full max-h-[590px]">
            {isLoading && (
              <div className="flex flex-col gap-2">
                {Array.from(Array(5)).map((_, index) => (
                  <Skeleton key={index} className="rounded-md w-full h-8" />
                ))}
              </div>
            )}
            {folders &&
              folders.map((folder) => {
                return (
                  <FolderItem
                    key={folder.id}
                    folderDisplayName={folder.displayName}
                    numberOfFlows={folder.numberOfFlows}
                    folderId={folder.id}
                    refetch={refetch}
                    disableMenu={false}
                    selectedFolderId={selectedFolderId}
                    updateSearchParams={updateSearchParams}
                  />
                );
              })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export { FolderFilterList };
