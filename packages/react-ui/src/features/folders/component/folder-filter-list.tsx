import { FolderDto } from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQuery } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import {
  EllipsisVertical,
  Folder,
  Pencil,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { foldersApi } from '../lib/folders-api';
import { foldersHooks } from '../lib/folders-hooks';

import { RenameFolderDialog } from './rename-folder-dialog';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/seperator';
import { TextWithIcon } from '@/components/ui/text-with-icon';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

const CreateFolderFormSchema = Type.Object({
  displayName: Type.String({
    errorMessage: 'Please enter folder name',
  }),
});

type CreateFolderFormSchema = Static<typeof CreateFolderFormSchema>;

const FolderFilterList = ({
  refresh,
  selectedFolderId,
  setSelectedFolderId,
}: {
  refresh: number;
  selectedFolderId: string | undefined;
  setSelectedFolderId: Dispatch<SetStateAction<string | undefined>>;
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const form = useForm<CreateFolderFormSchema>({
    resolver: typeboxResolver(CreateFolderFormSchema),
  });

  const { data, refetch } = foldersHooks.useFolders();

  const { data: allFlowsCount } = useQuery({
    queryKey: ['flowsCount', authenticationSession.getProjectId()],
    queryFn: flowsApi.count,
  });

  const { mutate, isPending } = useMutation<
    FolderDto,
    Error,
    { displayName: string }
  >({
    mutationFn: async (data) => {
      return await foldersApi.create({
        displayName: data.displayName,
      });
    },
    onSuccess: () => {
      setIsDialogOpen(false);
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
              message: 'The email is already added.',
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

  useEffect(() => {
    refetch();
  }, [refresh]);

  return (
    <Card className="max-h-[350px]">
      <CardHeader>
        <CardTitle className="flex flex-row items-center justify-center">
          <span className="flex">Folders</span>
          <div className="grow"></div>
          <div className="flex items-center justify-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger>
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex w-[200px] flex-col space-y-1">
          <Button
            variant="secondary"
            className={`flex w-full justify-start ${
              !selectedFolderId ? 'bg-muted' : 'bg-background'
            }`}
            onClick={() => setSelectedFolderId(undefined)}
          >
            <TextWithIcon icon={<Folder size={18} />} text="All flows" />
            <div className="grow"></div>
            <span className="text-muted-foreground">{allFlowsCount}</span>
          </Button>
          <Separator className="my-6" />
          <div className="h-[200px] overflow-y-scroll">
            {data?.data?.map((folder) => {
              return (
                <div key={folder.id} className="group">
                  <Button
                    variant="ghost"
                    className={`w-full justify-between ${
                      selectedFolderId === folder.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <span>{folder.displayName}</span>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-row -space-x-4"
                    >
                      <span className="visible text-muted-foreground group-hover:invisible">
                        {folder.numberOfFlows}
                      </span>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger
                          asChild
                          className="invisible group-hover:visible"
                        >
                          <EllipsisVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <RenameFolderDialog
                            folderId={folder.id}
                            onRename={() => refetch()}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
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
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <div className="flex flex-row gap-2 items-center">
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="text-destructive">Delete</span>
                              </div>
                            </DropdownMenuItem>
                          </ConfirmationDeleteDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { FolderFilterList };
