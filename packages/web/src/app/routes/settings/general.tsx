import { isNil, Permission, tryCatch } from '@activepieces/core-utils';
import { t } from 'i18next';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { projectSettingsFormDefaults } from '@/app/components/project-settings/form-defaults';
import {
  FormValues,
  GeneralSettings,
} from '@/app/components/project-settings/general';
import { ProjectAvatar } from '@/app/components/project-avatar';
import { Button } from '@/components/ui/button';
import { INTERNAL_ERROR_MESSAGE } from '@/components/ui/sonner';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { api } from '@/lib/api';

export function GeneralSettingsPage() {
  const { checkAccess } = useAuthorization();
  const { project } = projectCollectionUtils.useCurrentProject();

  const form = useForm<FormValues>({
    defaultValues: projectSettingsFormDefaults(project),
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
  });

  useEffect(() => {
    form.reset(projectSettingsFormDefaults(project));
  }, [project.id]);

  const handleSave = async (values: FormValues) => {
    const activeFlowsLimitChanged =
      (values.activeFlowsLimit ?? null) !==
      (project.plan?.activeFlowsLimit ?? null);
    const tx = projectCollectionUtils.update(project.id, {
      displayName: values.projectName,
      externalId: values.externalId,
      icon: values.icon,
      maxConcurrentJobs: values.maxConcurrentJobs,
      sensitive: values.sensitive,
      plan: activeFlowsLimitChanged
        ? {
            ...project.plan,
            activeFlowsLimit: values.activeFlowsLimit ?? null,
          }
        : undefined,
    });
    const { error } = await tryCatch(() => tx.isPersisted.promise);
    if (!isNil(error)) {
      toast.error(api.extractServerErrorMessage(error, INTERNAL_ERROR_MESSAGE));
      return;
    }
    toast.success(t('Your changes have been saved.'), { duration: 3000 });
    form.reset(values);
  };

  const currentIconColor = form.watch('icon')?.color ?? project.icon.color;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProjectAvatar
          displayName={project.displayName}
          projectType={project.type}
          iconColor={currentIconColor}
          size="md"
          showBackground={true}
        />
        <div>
          <h2 className="text-lg font-semibold">
            {form.watch('projectName') ?? project.displayName}
          </h2>
          <p className="text-sm text-gray-11">{t('General settings')}</p>
        </div>
      </div>

      <div className="min-w-0">
        <GeneralSettings form={form} />
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button
          disabled={!form.formState.isDirty}
          size="sm"
          onClick={form.handleSubmit(handleSave)}
        >
          {t('Save Changes')}
        </Button>
      </div>
    </div>
  );
}
