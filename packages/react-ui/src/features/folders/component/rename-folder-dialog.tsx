import { Folder } from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { foldersApi } from '../lib/folders-api';

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

const RenameFolderSchema = Type.Object({
  displayName: Type.String({
    errorMessage: 'Please enter a folder name',
  }),
});

type RenameFolderSchema = Static<typeof RenameFolderSchema>;

const RenameFolderDialog = ({
  children,
  folderId,
  onRename,
}: {
  children: React.ReactNode;
  folderId: string;
  onRename: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<RenameFolderSchema>({
    resolver: typeboxResolver(RenameFolderSchema),
  });

  const { mutate, isPending } = useMutation<Folder, Error, RenameFolderSchema>({
    mutationFn: async (data) =>
      await foldersApi.renameFolder(folderId, {
        displayName: data.displayName,
      }),
    onSuccess: () => {
      setIsOpen(false);
      onRename();
      toast({
        title: 'Renamed flow successfully',
      });
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="w-full">{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit((data) => mutate(data))}>
            <FormField
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <Input
                    {...field}
                    required
                    id="displayName"
                    placeholder="New Folder Name"
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
  );
};

export { RenameFolderDialog };
