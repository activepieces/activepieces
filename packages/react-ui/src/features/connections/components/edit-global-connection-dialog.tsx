import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';

import { AssignConnectionToProjectsControl } from '../../../components/ui/assign-global-connection-to-projects';
import { globalConnectionsApi } from '../lib/global-connections-api';
import {
  ConnectionNameAlreadyExists,
  isConnectionNameUnique,
  NoProjectSelected,
} from '../lib/utils';

const EditGlobalConnectionSchema = Type.Object({
  displayName: Type.String(),
  projectIds: Type.Array(Type.String()),
});

type EditGlobalConnectionSchema = Static<typeof EditGlobalConnectionSchema>;

type EditGlobalConnectionDialogProps = {
  connectionId: string;
  currentName: string;
  projectIds: string[];
  onEdit: () => void;
  userHasPermissionToEdit: boolean;
};

const EditGlobalConnectionDialog: React.FC<EditGlobalConnectionDialogProps> = ({
  connectionId,
  currentName,
  projectIds,
  onEdit,
  userHasPermissionToEdit,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const editConnectionForm = useForm<EditGlobalConnectionSchema>({
    resolver: typeboxResolver(EditGlobalConnectionSchema),
    defaultValues: {
      displayName: currentName,
      projectIds: projectIds,
    },
  });

  const { mutate, isPending } = useMutation<
    AppConnectionWithoutSensitiveData,
    Error,
    {
      connectionId: string;
      displayName: string;
      projectIds: string[];
    }
  >({
    mutationFn: async ({ connectionId, displayName, projectIds }) => {
      if (
        !(await isConnectionNameUnique(true, displayName)) &&
        displayName !== currentName
      ) {
        throw new ConnectionNameAlreadyExists();
      }
      if (projectIds.length === 0) {
        throw new NoProjectSelected();
      }
      return globalConnectionsApi.update(connectionId, {
        displayName,
        projectIds,
      });
    },
    onSuccess: () => {
      onEdit();
      toast({
        title: t('Success'),
        description: t('Connection has been updated.'),
        duration: 3000,
      });
      setIsOpen(false);
    },
    onError: (error) => {
      if (error instanceof ConnectionNameAlreadyExists) {
        editConnectionForm.setError('displayName', {
          message: error.message,
        });
      } else if (error instanceof NoProjectSelected) {
        editConnectionForm.setError('projectIds', {
          message: error.message,
        });
      } else {
        toast(INTERNAL_ERROR_TOAST);
      }
    },
  });

  return (
    <Tooltip>
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <DialogTrigger asChild>
          <>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!userHasPermissionToEdit}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!userHasPermissionToEdit ? t('Permission needed') : t('Edit')}
            </TooltipContent>
          </>
        </DialogTrigger>
        <DialogContent onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('Edit Global Connection')}</DialogTitle>
          </DialogHeader>
          <Form {...editConnectionForm}>
            <form
              onSubmit={editConnectionForm.handleSubmit((data) =>
                mutate({
                  connectionId,
                  displayName: data.displayName,
                  projectIds: data.projectIds,
                }),
              )}
            >
              <div className="grid space-y-4">
                <FormField
                  control={editConnectionForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem className="grid space-y-2">
                      <Label htmlFor="displayName">{t('Name')}</Label>
                      <Input
                        {...field}
                        id="displayName"
                        placeholder={t('Connection Name')}
                        className="rounded-sm"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <AssignConnectionToProjectsControl
                  control={editConnectionForm.control}
                  name="projectIds"
                />
                {editConnectionForm?.formState?.errors?.root?.serverError && (
                  <FormMessage>
                    {
                      editConnectionForm.formState.errors.root.serverError
                        .message
                    }
                  </FormMessage>
                )}
              </div>
              <DialogFooter className="mt-8">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsOpen(false);
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button loading={isPending}>{t('Save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Tooltip>
  );
};

export { EditGlobalConnectionDialog };
