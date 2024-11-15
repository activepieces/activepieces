import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';

import { appConnectionsApi } from '../lib/app-connections-api';

const RenameConnectionSchema = Type.Object({
  displayName: Type.String(),
});

type RenameConnectionSchema = Static<typeof RenameConnectionSchema>;

type RenameConnectionDialogProps = {
  children: React.ReactNode;
  connectionId: string;
  currentName: string;
  onRename: () => void;
};

const RenameConnectionDialog: React.FC<RenameConnectionDialogProps> = ({
  children,
  connectionId,
  currentName,
  onRename,
}) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const renameConnectionForm = useForm<RenameConnectionSchema>({
    resolver: typeboxResolver(RenameConnectionSchema),
    defaultValues: {
      displayName: currentName,
    },
  });

  const { mutate, isPending } = useMutation<
    AppConnectionWithoutSensitiveData,
    Error,
    {
      connectionId: string;
      displayName: string;
    }
  >({
    mutationFn: ({ connectionId, displayName }) => {
      return appConnectionsApi.update(connectionId, { displayName });
    },
    onSuccess: () => {
      setIsRenameDialogOpen(false);
      onRename();
      toast({
        title: t('Success'),
        description: t('Connection has been renamed.'),
        duration: 3000,
      });
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  return (
    <Dialog
      open={isRenameDialogOpen}
      onOpenChange={(open) => setIsRenameDialogOpen(open)}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Rename Connection')}</DialogTitle>
        </DialogHeader>
        <Form {...renameConnectionForm}>
          <form
            className="grid space-y-4"
            onSubmit={renameConnectionForm.handleSubmit((data) =>
              mutate({
                connectionId,
                displayName: data.displayName,
              }),
            )}
          >
            <FormField
              control={renameConnectionForm.control}
              name="displayName"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="displayName">{t('Name')}</Label>
                  <Input
                    {...field}
                    id="displayName"
                    placeholder={t('New Connection Name')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {renameConnectionForm?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {renameConnectionForm.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <Button loading={isPending}>{t('Confirm')}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { RenameConnectionDialog };
