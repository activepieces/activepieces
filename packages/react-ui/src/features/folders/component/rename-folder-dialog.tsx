import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
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
import { validationUtils } from '@/lib/utils';
import { Folder } from '@activepieces/shared';

import { foldersApi } from '../lib/folders-api';

const RenameFolderSchema = Type.Object({
  displayName: Type.String({
    errorMessage: t('Please enter a folder name'),
  }),
});

type RenameFolderSchema = Static<typeof RenameFolderSchema>;

const RenameFolderDialog = ({
  children,
  folderId,
  onRename,
  name,
}: {
  children: React.ReactNode;
  folderId: string;
  onRename: () => void;
  name: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<RenameFolderSchema>({
    resolver: typeboxResolver(RenameFolderSchema),
  });

  const { mutate, isPending } = useMutation<Folder, Error, RenameFolderSchema>({
    mutationFn: async (data) => {
      return await foldersApi.renameFolder(folderId, {
        displayName: data.displayName,
      });
    },
    onSuccess: () => {
      setIsOpen(false);
      onRename();
      toast({
        title: t('Renamed flow successfully'),
      });
    },
    onError: (err) => {
      if (validationUtils.isValidationError(err)) {
        form.setError('displayName', {
          message: t('Folder name already used'),
        });
      } else {
        toast(INTERNAL_ERROR_TOAST);
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="w-full" asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('Rename')} {name}
          </DialogTitle>
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
                    placeholder={t('New Folder Name')}
                    className="rounded-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        form.handleSubmit((data) => mutate(data))();
                      }
                    }}
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                }}
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

export { RenameFolderDialog };
