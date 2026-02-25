import { CreatePlatformProjectRequest } from '@activepieces/ee-shared';
import { ProjectWithLimits } from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type } from '@sinclair/typebox';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { internalErrorToast } from '@/components/ui/sonner';
import { globalConnectionsQueries } from '@/features/connections/lib/global-connections-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';

type NewProjectDialogProps = {
  children: React.ReactNode;
  onCreate?: (project: ProjectWithLimits) => void;
};

export const NewProjectDialog = ({
  children,
  onCreate,
}: NewProjectDialogProps) => {
  const [open, setOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const globalConnectionsEnabled = platform.plan.globalConnectionsEnabled;

  const { data: globalConnectionsPage, isLoading: isLoadingConnections } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 9999 },
      extraKeys: ['new-project-dialog'],
      enabled: globalConnectionsEnabled,
    });

  const form = useForm<CreatePlatformProjectRequest>({
    resolver: typeboxResolver(
      Type.Object({
        displayName: Type.String({
          minLength: 1,
          errorMessage: t('Name is required'),
        }),
      }),
    ),
    defaultValues: {
      globalConnectionIds: [],
    },
  });

  const { mutate, isPending } = projectCollectionUtils.useCreateProject(
    (data) => {
      onCreate?.(data);
      setOpen(false);
    },
    (error) => {
      console.error(error);
      internalErrorToast();
    },
  );

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const autoSelectedIds =
        globalConnectionsPage?.data
          .filter((c) => c.preSelectForNewProjects)
          .map((c) => c.id) ?? [];
      form.reset({
        displayName: '',
        globalConnectionIds: autoSelectedIds,
      });
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create New Project')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={(e) =>
              form.handleSubmit(() => mutate(form.getValues()))(e)
            }
          >
            <FormField
              name="displayName"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="displayName">{t('Project Name')}</Label>
                  <Input
                    {...field}
                    id="displayName"
                    placeholder={t('Project Name')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {globalConnectionsEnabled && (
              <FormField
                name="globalConnectionIds"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <Label>{t('Global Connections')}</Label>
                    <MultiSelectPieceProperty
                      placeholder={t('Select global connections')}
                      options={
                        globalConnectionsPage?.data.map((connection) => ({
                          value: connection.id,
                          label: connection.displayName,
                        })) ?? []
                      }
                      loading={isLoadingConnections}
                      onChange={(value) => {
                        field.onChange(value ?? []);
                      }}
                      initialValues={field.value ?? []}
                      showDeselect={(field.value ?? []).length > 0}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            disabled={isPending}
            loading={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              form.handleSubmit(() => mutate(form.getValues()))(e);
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
