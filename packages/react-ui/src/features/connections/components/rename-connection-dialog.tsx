import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import React, { useState, forwardRef } from 'react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import {
  AppConnectionWithoutSensitiveData,
  PlatformRole,
} from '@activepieces/shared';

import { appConnectionsApi } from '../lib/app-connections-api';
import {
  ConnectionNameAlreadyExists,
  isConnectionNameUnique,
} from '../lib/utils';

const RenameConnectionSchema = Type.Object({
  displayName: Type.String(),
});

type RenameConnectionSchema = Static<typeof RenameConnectionSchema>;

type RenameConnectionDialogProps = {
  connectionId: string;
  currentName: string;
  isPlatformConnection: boolean;
  userPlatformRole: PlatformRole | null;
  userHasPermissionToWriteAppConnection: boolean;
  onRename: () => void;
};

const RenameConnectionDialog = forwardRef<
  HTMLDivElement,
  RenameConnectionDialogProps
>(
  (
    {
      connectionId,
      currentName,
      isPlatformConnection,
      userPlatformRole,
      userHasPermissionToWriteAppConnection,
      onRename,
    },
    _,
  ) => {
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
      mutationFn: async ({ connectionId, displayName }) => {
        const existingConnection = await isConnectionNameUnique(
          false,
          displayName,
        );
        if (!existingConnection && displayName !== currentName) {
          throw new ConnectionNameAlreadyExists();
        }
        return appConnectionsApi.update(connectionId, { displayName });
      },
      onSuccess: () => {
        onRename();
        toast({
          title: t('Success'),
          description: t('Connection has been renamed.'),
          duration: 3000,
        });
        setIsRenameDialogOpen(false);
      },
      onError: (error) => {
        if (error instanceof ConnectionNameAlreadyExists) {
          renameConnectionForm.setError('displayName', {
            message: error.message,
          });
        } else {
          toast(INTERNAL_ERROR_TOAST);
        }
      },
    });

    return (
      <Dialog
        open={isRenameDialogOpen}
        onOpenChange={(open) => setIsRenameDialogOpen(open)}
      >
        <DialogTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={
                  isPlatformConnection
                    ? userPlatformRole !== PlatformRole.ADMIN
                    : !userHasPermissionToWriteAppConnection
                }
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsRenameDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {userPlatformRole !== PlatformRole.ADMIN &&
              !userHasPermissionToWriteAppConnection
                ? t('Permission needed')
                : t('Rename')}
            </TooltipContent>
          </Tooltip>
        </DialogTrigger>
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
                  {
                    renameConnectionForm.formState.errors.root.serverError
                      .message
                  }
                </FormMessage>
              )}
              <Button loading={isPending}>{t('Confirm')}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  },
);

RenameConnectionDialog.displayName = 'RenameConnectionDialog';

export { RenameConnectionDialog };
