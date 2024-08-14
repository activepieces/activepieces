import { FolderDto } from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQuery } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import {
  EllipsisVertical,
  Folder,
  FolderOpen,
  Pencil,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLocation, useSearchParams } from 'react-router-dom';

import { foldersApi } from '../lib/folders-api';
import { foldersHooks } from '../lib/folders-hooks';
import { foldersUtils } from '../lib/folders-utils';

import { RenameFolderDialog } from './rename-folder-dialog';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const CreateFolderFormSchema = Type.Object({
  displayName: Type.String({
    errorMessage: 'Please enter folder name',
  }),
});

type CreateFolderFormSchema = Static<typeof CreateFolderFormSchema>;

type FolderItemProps = {
  folder: FolderDto;
  refetch: () => void;
  updateSearchParams: (folderId: string | undefined) => void;
  selectedFolderId: string | null;
};
const FolderItem = ({
  folder,
  refetch,
  updateSearchParams,
  selectedFolderId,
}: FolderItemProps) => {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  return (
    <div key={folder.id} className="group py-1">
      <Button
        variant="ghost"
        className={cn('w-full  items-center justify-start gap-2', {
          'bg-muted': selectedFolderId === folder.id,
        })}
        onClick={() => updateSearchParams(folder.id)}
      >
        <TextWithIcon
          className="flex-grow"
          icon={
            selectedFolderId === folder.id ? (
              <FolderOpen
                size={'18px'}
                className="fill-muted-foreground/75 border-0 text-muted-foreground flex-shrink-0"
              />
            ) : (
              <Folder
                size={'18px'}
                className="fill-muted-foreground border-0 text-muted-foreground flex-shrink-0"
              />
            )
          }
          text={
            <div className="flex-grow whitespace-break-spaces break-all text-start">
              {folder.displayName}
            </div>
          }
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-row -space-x-4 min-w-5"
          >
            <DropdownMenu onOpenChange={setIsActionMenuOpen} modal={false}>
              <DropdownMenuTrigger
                asChild
                className={cn('invisible group-hover:visible', {
                  visible: isActionMenuOpen,
                })}
              >
                <EllipsisVertical className="h-5 w-5" />
              </DropdownMenuTrigger>
              <span
                className={cn(
                  'text-muted-foreground self-end group-hover:invisible',
                  { invisible: isActionMenuOpen },
                )}
              >
                {folder.numberOfFlows}
              </span>
              <DropdownMenuContent>
                <RenameFolderDialog
                  folderId={folder.id}
                  onRename={() => refetch()}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div className="flex flex-row gap-2 items-center">
                      <Pencil className="h-4 w-4" />
                      <span>Rename</span>
                    </div>
                  </DropdownMenuItem>
                </RenameFolderDialog>
                <ConfirmationDeleteDialog
                  title={`Delete folder ${folder.displayName}`}
                  message="If you delete this folder, we will keep its flows and move them to Uncategorized."
                  mutationFn={async () => {
                    await foldersApi.delete(folder.id);
                    refetch();
                  }}
                  entityName={folder.displayName}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div className="flex flex-row gap-2 items-center">
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">Delete</span>
                    </div>
                  </DropdownMenuItem>
                </ConfirmationDeleteDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TextWithIcon>
      </Button>
    </div>
  );
};

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
    folderId
      ? newQueryParameters.set('folderId', folderId)
      : newQueryParameters.delete('folderId');
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
        title: 'Added folder successfully',
      });
    },
    onError: (error) => {
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.Conflict: {
            form.setError('root.serverError', {
              message: 'The folder name already exists.',
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
        <span className="flex">Folders</span>
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
                <DialogTitle>New Folder</DialogTitle>
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
                          placeholder="Folder Name"
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
                      Confirm
                    </Button>
                  </DialogFooter>
                </form>
              </FormProvider>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex w-[200px] h-full flex-col space-y-1">
        <Button
          variant="secondary"
          className={cn('flex w-full justify-start bg-background', {
            'bg-muted': !selectedFolderId,
          })}
          onClick={() => updateSearchParams(undefined)}
        >
          <TextWithIcon icon={<Folder size={18} />} text="All flows" />
          <div className="grow"></div>
          <span className="text-muted-foreground">{allFlowsCount}</span>
        </Button>
        <Button
          variant="ghost"
          className={cn('flex w-full justify-start bg-background', {
            'bg-muted': selectedFolderId === 'NULL',
          })}
          onClick={() => updateSearchParams('NULL')}
        >
          <TextWithIcon icon={<Folder size={18} />} text="Uncategorized" />
          <div className="grow"></div>
          <div className="flex flex-row -space-x-4">
            <span className="visible text-muted-foreground group-hover:invisible">
              {foldersUtils.extractUncategorizedFlows(allFlowsCount, folders)}
            </span>
          </div>
        </Button>
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
                    folder={folder}
                    refetch={refetch}
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
