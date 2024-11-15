import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
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
import { projectHooks } from '@/hooks/project-hooks';
import { AppConnectionWithoutSensitiveData, isNil } from '@activepieces/shared';

import { globalConnectionsApi } from '../lib/global-connections-api';

const EditGlobalConnectionSchema = Type.Object({
  displayName: Type.String(),
  projectIds: Type.Array(Type.String()),
});

type EditGlobalConnectionSchema = Static<typeof EditGlobalConnectionSchema>;

type EditGlobalConnectionDialogProps = {
  children: React.ReactNode;
  connectionId: string;
  currentName: string;
  projectIds: string[];
  onEdit: () => void;
};

const EditGlobalConnectionDialog: React.FC<EditGlobalConnectionDialogProps> = ({
  children,
  connectionId,
  currentName,
  projectIds,
  onEdit,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: projects } = projectHooks.useProjects();

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
    mutationFn: ({ connectionId, displayName, projectIds }) => {
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
      setIsDialogOpen(false);
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => setIsDialogOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
              <FormField
                control={editConnectionForm.control}
                name="projectIds"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <Label>{t('Assign to Projects')}</Label>
                    <MultiSelectPieceProperty
                      placeholder={t('Select projects')}
                      options={
                        projects?.map((project) => ({
                          value: project.id,
                          label: project.displayName,
                        })) ?? []
                      }
                      loading={!projects}
                      onChange={(value) => {
                        field.onChange(isNil(value) ? [] : value);
                      }}
                      initialValues={field.value}
                      showDeselect={field.value.length > 0}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editConnectionForm?.formState?.errors?.root?.serverError && (
                <FormMessage>
                  {editConnectionForm.formState.errors.root.serverError.message}
                </FormMessage>
              )}
            </div>
            <div className="mt-8">
              <Button loading={isPending}>{t('Save Changes')}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { EditGlobalConnectionDialog };
