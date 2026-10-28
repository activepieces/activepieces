import { ProjectWithLimits } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';

export function AddDefaultProjectsDialog({
  open,
  onOpenChange,
  teamProjects,
  defaultProjectIds,
  isSaving,
  onSave,
}: AddDefaultProjectsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <AddDefaultProjectsContent
          key={open ? 'open' : 'closed'}
          teamProjects={teamProjects}
          defaultProjectIds={defaultProjectIds}
          isSaving={isSaving}
          onSave={onSave}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddDefaultProjectsContent({
  teamProjects,
  defaultProjectIds,
  isSaving,
  onSave,
  onCancel,
}: AddDefaultProjectsContentProps) {
  const form = useForm<DefaultProjectsFormValues>({
    defaultValues: { projectIds: defaultProjectIds },
    resolver: zodResolver(defaultProjectsFormSchema),
  });
  const [search, setSearch] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const projectIds = form.watch('projectIds');
  const query = search.trim();
  const filteredProjects = teamProjects.filter((project) =>
    project.displayName.toLowerCase().includes(query.toLowerCase()),
  );
  const hasExistingDefaults = defaultProjectIds.length > 0;

  const selectedIds = teamProjects
    .map((project) => project.id)
    .filter((id) => projectIds.includes(id));
  const removedProjects = teamProjects.filter(
    (project) =>
      defaultProjectIds.includes(project.id) &&
      !projectIds.includes(project.id),
  );

  const showServerError = (error: unknown) => {
    form.setError('root.serverError', {
      type: 'manual',
      message:
        api.serverErrorMessage(error) ??
        t('Failed to save changes. Please try again.'),
    });
  };

  const submit = form.handleSubmit(async () => {
    if (removedProjects.length > 0) {
      setIsConfirmOpen(true);
      return;
    }
    await onSave(selectedIds).catch(showServerError);
  });

  return (
    <Form {...form}>
      <div className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{t('Add default projects')}</DialogTitle>
          <DialogDescription>
            {t(
              "New Members join these as Editors. People already on the platform aren't added.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-11" />
            <Input
              className="pl-8"
              placeholder={t('Search projects')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <FormField
            control={form.control}
            name="projectIds"
            render={({ field }) => (
              <FormItem>
                <ScrollArea className="h-64">
                  <div>
                    {filteredProjects.length === 0 && (
                      <p className="py-8 text-center text-sm text-gray-11">
                        {query.length > 0
                          ? t('No projects match "{search}"', { search: query })
                          : t(
                              'No team projects yet. Create one on the Projects page.',
                            )}
                      </p>
                    )}
                    {filteredProjects.map((project) => {
                      const isChecked = field.value.includes(project.id);
                      const toggleProject = () =>
                        field.onChange(
                          isChecked
                            ? field.value.filter((id) => id !== project.id)
                            : [...field.value, project.id],
                        );
                      return (
                        <button
                          key={project.id}
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-gray-3"
                          onClick={toggleProject}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={toggleProject}
                            onClick={(event) => event.stopPropagation()}
                          />
                          <TextWithTooltip tooltipMessage={project.displayName}>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                              {project.displayName}
                            </span>
                          </TextWithTooltip>
                          <span className="ml-auto shrink-0 text-xs text-gray-11">
                            {t('projectMemberCount', {
                              count: project.analytics.totalUsers,
                            })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root?.serverError && (
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <span className="self-center text-sm text-gray-11">
            {t('{count} selected', { count: selectedIds.length })}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              loading={isSaving}
              disabled={selectedIds.length === 0 && !hasExistingDefaults}
              onClick={submit}
            >
              {hasExistingDefaults
                ? t('Save')
                : t('addDefaultProjectsCount', { count: selectedIds.length })}
            </Button>
          </div>
        </DialogFooter>
        <ConfirmationDeleteDialog
          open={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          title={t('removeDefaultProjectsTitle', {
            count: removedProjects.length,
          })}
          message={t('removeDefaultProjectsMessage', {
            count: removedProjects.length,
            projects: removedProjects
              .map((project) => project.displayName)
              .join(', '),
          })}
          entityName={t('Default projects')}
          buttonText={t('Remove')}
          mutationFn={() => onSave(selectedIds)}
          onError={showServerError}
        />
      </div>
    </Form>
  );
}

const defaultProjectsFormSchema = z.object({
  projectIds: z.array(z.string()),
});

type AddDefaultProjectsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamProjects: TeamProject[];
  defaultProjectIds: string[];
  isSaving: boolean;
  onSave: (defaultProjectIds: string[]) => Promise<void>;
};

type AddDefaultProjectsContentProps = {
  teamProjects: TeamProject[];
  defaultProjectIds: string[];
  isSaving: boolean;
  onSave: (defaultProjectIds: string[]) => Promise<void>;
  onCancel: () => void;
};

type TeamProject = Pick<ProjectWithLimits, 'id' | 'displayName' | 'analytics'>;

type DefaultProjectsFormValues = z.infer<typeof defaultProjectsFormSchema>;
