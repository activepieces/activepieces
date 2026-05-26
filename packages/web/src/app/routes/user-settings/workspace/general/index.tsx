import { Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ProjectAvatar } from '@/app/components/project-avatar';
import {
  GeneralSettings,
  FormValues,
} from '@/app/components/project-settings/general';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { internalErrorToast } from '@/components/ui/sonner';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';

export default function WorkspaceGeneralPage() {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const canWrite = checkAccess(Permission.WRITE_PROJECT);

  const form = useForm<FormValues>({
    defaultValues: {
      projectName: project.displayName,
      icon: project.icon,
      externalId: project.externalId ?? undefined,
      maxConcurrentJobs: project.maxConcurrentJobs,
    },
    disabled: !canWrite,
  });

  const { mutate, isPending } = projectCollectionUtils.useUpdateProject(
    () => {
      toast.success(t('Changes saved.'));
      form.reset(form.getValues());
    },
    () => internalErrorToast(),
  );

  const handleSave = (values: FormValues) => {
    mutate({
      projectId: project.id,
      request: {
        displayName: values.projectName,
        externalId: values.externalId,
        icon: values.icon,
        maxConcurrentJobs: values.maxConcurrentJobs,
      },
    });
  };

  const currentIconColor = form.watch('icon')?.color ?? project.icon.color;

  return (
    <div className="flex flex-col">
      <ProjectAvatar
        displayName={project.displayName}
        projectType={project.type}
        iconColor={currentIconColor}
        size="md"
        showBackground={true}
      />
      <div className="max-w-xl px-8 py-8 flex flex-col gap-8">
        <div>
          <h2 className="text-base font-semibold">{t('General')}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('Manage your workspace name and settings.')}
          </p>
        </div>

        <Separator />

        <GeneralSettings form={form} projectNameLabel={t('Workspace Name')} />

        {canWrite && (
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!form.formState.isDirty || isPending}
              loading={isPending}
              onClick={form.handleSubmit(handleSave)}
            >
              {t('Save changes')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
