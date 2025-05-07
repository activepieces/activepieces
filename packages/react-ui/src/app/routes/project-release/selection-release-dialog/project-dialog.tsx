import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField, FormItem, Form, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { projectHooks } from '@/hooks/project-hooks';
import { DiffReleaseRequest, ProjectReleaseType } from '@activepieces/shared';

import { CreateReleaseDialog } from '../create-release-dialog';

const FormSchema = Type.Object({
  selectedProject: Type.String({
    errorMessage: t('Please select project'),
    required: true,
  }),
});

type FormSchema = Static<typeof FormSchema>;

type ProjectSelectionDialogProps = {
  projectId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
};

export function ProjectSelectionDialog({
  projectId,
  open,
  setOpen,
  onSuccess,
}: ProjectSelectionDialogProps) {
  const { data: projects, isLoading: loadingProjects } =
    projectHooks.useProjects();
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] =
    useState(false);
  const [syncPlan, setSyncPlan] = useState<any>(null);
  const { mutate: loadSyncPlan, isPending: isDoingDiff } = useMutation({
    mutationFn: (request: DiffReleaseRequest) =>
      projectReleaseApi.diff(request),
    onSuccess: (plan) => {
      if (
        (!plan.operations || plan.operations.length === 0) &&
        (!plan.tables || plan.tables.length === 0)
      ) {
        toast({
          title: t('No Changes Found'),
          description: t('There are no differences to apply'),
          variant: 'default',
        });
        return;
      }
      setSyncPlan(plan);
      setOpen(false);
      setIsCreateReleaseDialogOpen(true);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const form = useForm<FormSchema>({
    resolver: typeboxResolver(FormSchema),
    defaultValues: {
      selectedProject: projects?.find((project) => project.id !== projectId)
        ?.id,
    },
  });
  const onSubmit = (data: FormSchema) => {
    if (!data.selectedProject) {
      form.setError('selectedProject', {
        type: 'required',
        message: t('Please select a project'),
      });
      return;
    }
    loadSyncPlan({
      type: ProjectReleaseType.PROJECT,
      targetProjectId: data.selectedProject,
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
          if (open) {
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('Create Release')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="selectedProject"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <Label>{t('Project')}</Label>
                    <SearchableSelect
                      onChange={field.onChange}
                      value={field.value}
                      placeholder={t('Search projects...')}
                      options={(projects ?? [])
                        .filter((project) => project.id !== projectId)
                        .map((project) => ({
                          label: project.displayName,
                          value: project.id,
                        }))}
                      loading={loadingProjects}
                    ></SearchableSelect>

                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <DialogFooter>
                <Button
                  variant={'outline'}
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  type="submit"
                  onClick={() => form.handleSubmit(onSubmit)}
                  loading={isDoingDiff}
                >
                  {t('Review Changes')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {isCreateReleaseDialogOpen && (
        <CreateReleaseDialog
          loading={isDoingDiff}
          open={isCreateReleaseDialogOpen}
          setOpen={setIsCreateReleaseDialogOpen}
          refetch={onSuccess}
          diffRequest={{
            targetProjectId: form.getValues('selectedProject'),
            type: ProjectReleaseType.PROJECT,
          }}
          plan={syncPlan}
        />
      )}
    </>
  );
}
