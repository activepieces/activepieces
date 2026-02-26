import { CreatePlatformProjectRequest } from '@activepieces/ee-shared';
import {
  AppConnectionWithoutSensitiveData,
  ProjectWithLimits,
} from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type } from '@sinclair/typebox';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { DefaultTag } from '@/components/custom/default-tag';
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
import { SkeletonList } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import { globalConnectionsQueries } from '@/features/connections/lib/global-connections-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';

type NewProjectDialogProps = {
  children: React.ReactNode;
  onCreate?: (project: ProjectWithLimits) => void;
};

export const NewProjectDialog = (props: NewProjectDialogProps) => {
  const [open, setOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const globalConnectionsEnabled = platform.plan.globalConnectionsEnabled;

  const { data: globalConnectionsPage, isLoading: isLoadingConnections } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 9999 },
      extraKeys: [],
    });

  const globalConnections = globalConnectionsPage?.data ?? [];

  return (
    <Dialog key={open ? 'open' : 'closed'} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create New Project')}</DialogTitle>
        </DialogHeader>
        {(!isLoadingConnections || !globalConnectionsEnabled) && (
          <NewProjectForm
            setOpen={setOpen}
            globalConnections={globalConnections}
            globalConnectionsEnabled={globalConnectionsEnabled}
            onCreate={props.onCreate}
          />
        )}
        {isLoadingConnections && globalConnectionsEnabled && (
          <SkeletonList numberOfItems={3} className="h-10" />
        )}
      </DialogContent>
    </Dialog>
  );
};

const NewProjectForm = ({
  onCreate,
  setOpen,
  globalConnections,
  globalConnectionsEnabled,
}: Omit<NewProjectDialogProps, 'children'> & {
  setOpen: (open: boolean) => void;
  globalConnections: AppConnectionWithoutSensitiveData[];
  globalConnectionsEnabled: boolean;
}) => {
  const queryClient = useQueryClient();
  const preselectedConnectionExternalIds = globalConnections
    .filter((connection) => connection.preSelectForNewProjects)
    .map((connection) => connection.externalId);

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
      globalConnectionExternalIds: preselectedConnectionExternalIds,
    },
  });

  const { mutate, isPending } = projectCollectionUtils.useCreateProject(
    (data) => {
      onCreate?.(data);
      setOpen(false);
      queryClient.invalidateQueries({
        queryKey: globalConnectionsQueries.getGlobalConnectionsQueryKey([]),
      });
    },
    (error) => {
      console.error(error);
      internalErrorToast();
    },
  );

  return (
    <>
      <Form {...form}>
        <form
          className="grid space-y-4"
          onSubmit={(e) => form.handleSubmit(() => mutate(form.getValues()))(e)}
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
              name="globalConnectionExternalIds"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label>{t('Global Connections')}</Label>
                  <MultiSelectPieceProperty
                    placeholder={t('Select global connections')}
                    options={
                      globalConnections.map((connection) => ({
                        value: connection.externalId,
                        label: connection.displayName,
                      })) ?? []
                    }
                    loading={false}
                    onChange={(value) => {
                      field.onChange(value ?? []);
                    }}
                    itemExtraContent={(index) => {
                      if (globalConnections[index].preSelectForNewProjects) {
                        return <DefaultTag />;
                      }
                      return null;
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
    </>
  );
};
