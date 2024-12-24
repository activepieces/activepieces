import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { t } from 'i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { ConnectGitDialog } from '@/features/git-sync/components/connect-git-dialog';
import { gitSyncHooks } from '@/features/git-sync/lib/git-sync-hooks';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import {
  ProjectOperationType,
  ProjectSyncPlan,
  ProjectSyncPlanOperation,
} from '@activepieces/ee-shared';
import { ProjectReleaseType } from '@activepieces/shared';

import { GitChange } from './git-change';

type GitReleaseDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  refetch: () => void;
};

const formSchema = z.object({
  name: z.string().min(1, t('Name is required')),
  description: z.string(),
});

type FormData = z.infer<typeof formSchema>;

type ChangesByType = {
  created: ProjectSyncPlanOperation[];
  updated: ProjectSyncPlanOperation[];
  deleted: ProjectSyncPlanOperation[];
};

const GitReleaseDialog = ({
  open,
  setOpen,
  refetch,
}: GitReleaseDialogProps) => {
  const [syncPlan, setSyncPlan] = useState<ProjectSyncPlan | null>(null);
  const [step, setStep] = useState(1);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const { project } = projectHooks.useCurrentProject();
  const { gitSync, isLoading } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.environmentEnabled,
  );

  const getDefaultReleaseName = () => {
    const now = new Date();
    const projectName = project.displayName || 'project';
    return `${projectName}_${format(now, 'yyyy-MM-dd_HH:mm')}`;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: getDefaultReleaseName(),
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: getDefaultReleaseName(),
        description: '',
      });
    }
  }, [open, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (gitSync) {
        return await projectReleaseApi.diff(ProjectReleaseType.GIT);
      }
    },
    onSuccess: (plan) => {
      if (step === 2) {
        setOpen(false);
        return;
      }
      if (plan?.operations.length === 0) {
        toast({
          title: t('No changes to pull'),
          description: t('There are no changes to pull'),
          duration: 3000,
        });
        setSyncPlan(null);
      } else if (plan) {
        setSyncPlan(plan);
        setStep(2);
      }
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const onSubmit = async () => {
    try {
      await mutate();
    } catch (error) {
      form.setError('root', {
        message: t('Failed to pull from Git. Please try again.'),
      });
    }
  };

  const { mutate: applyChanges } = useMutation({
    mutationFn: async () => {
      setIsApplyingChanges(true);
      if (gitSync) {
        projectReleaseApi
          .create({
            name: form.getValues('name'),
            description: form.getValues('description'),
            selectedFlowsIds: Array.from(selectedChanges),
            repoId: gitSync.id,
            type: ProjectReleaseType.GIT,
          })
          .then(() => {
            refetch();
            setOpen(false);
            setIsApplyingChanges(false);
          });
      }
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (syncPlan) {
      setSelectedChanges(new Set(syncPlan.operations.map((op) => op.flow.id)));
    }
  }, [syncPlan]);

  const changesByType: ChangesByType = useMemo(() => {
    if (!syncPlan) {
      return { created: [], updated: [], deleted: [] };
    }
    return syncPlan.operations.reduce(
      (acc, change) => {
        switch (change.type) {
          case ProjectOperationType.CREATE_FLOW:
            acc.created.push(change);
            break;
          case ProjectOperationType.UPDATE_FLOW:
            acc.updated.push(change);
            break;
          case ProjectOperationType.DELETE_FLOW:
            acc.deleted.push(change);
            break;
        }
        return acc;
      },
      { created: [], updated: [], deleted: [] } as ChangesByType,
    );
  }, [syncPlan]);

  const handleSelectAll = (type: keyof ChangesByType) => (checked: boolean) => {
    setSelectedChanges((prev) => {
      const newSet = new Set(prev);
      changesByType[type].forEach((change) => {
        if (checked) {
          newSet.add(change.flow.id);
        } else {
          newSet.delete(change.flow.id);
        }
      });
      return newSet;
    });
  };

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    created: true,
    updated: true,
    deleted: true,
  });

  if (isLoading) {
    return null;
  }

  return gitSync ? (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create Git Release')}</DialogTitle>
          <DialogDescription>
            {t('These are the changes that will be applied to the project')}
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <Label className="text-sm" htmlFor="name">
                  {t('Name')}
                </Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder={t('Required')}
                  onChange={(e) => {
                    form.setValue('name', e.target.value);
                  }}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm" htmlFor="description">
                  {t('Description')}
                </Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder={t('Optional')}
                  onChange={(e) => {
                    form.setValue('description', e.target.value);
                  }}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
            </div>
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                size={'sm'}
                onClick={() => setOpen(false)}
                variant={'outline'}
                disabled={isPending}
              >
                {t('Cancel')}
              </Button>
              <Button
                type="submit"
                size={'sm'}
                disabled={!form.formState.isValid || isPending}
                loading={isPending}
                className={syncPlan ? 'bg-green-500 text-white' : ''}
              >
                {t('Pull from Git')}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="max-h-[75vh] overflow-y-auto space-y-2">
            <div className="rounded-lg overflow-hidden">
              <button
                onClick={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    created: !prev.created,
                  }))
                }
                className="w-full flex items-center gap-2 p-3 bg-success-50/30 hover:bg-success-50/50 border-success-200 border text-success-700"
              >
                {expandedSections.created ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Checkbox
                  checked={
                    changesByType.created.length > 0 &&
                    changesByType.created.every((c) =>
                      selectedChanges.has(c.flow.id),
                    )
                  }
                  onCheckedChange={handleSelectAll('created')}
                  disabled={changesByType.created.length === 0}
                />
                <span className="font-semibold">
                  Added Flows ({changesByType.created.length})
                </span>
              </button>
              {expandedSections.created && (
                <div className="pl-8 pr-3 py-2 border-x border-b border-success-200 space-y-1">
                  {changesByType.created.length > 0 ? (
                    changesByType.created.map((change) => (
                      <GitChange
                        key={change.flow.id}
                        change={change}
                        selected={selectedChanges.has(change.flow.id)}
                        onSelect={(checked) => {
                          setSelectedChanges((prev) => {
                            const newSet = new Set(prev);
                            if (checked) {
                              newSet.add(change.flow.id);
                            } else {
                              newSet.delete(change.flow.id);
                            }
                            return newSet;
                          });
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground py-2">
                      No new flows
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg overflow-hidden">
              <button
                onClick={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    updated: !prev.updated,
                  }))
                }
                className="w-full flex items-center gap-2 p-3 bg-warning-50/30 hover:bg-warning-50/50 border-warning-200 border text-warning-700"
              >
                {expandedSections.updated ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Checkbox
                  checked={
                    changesByType.updated.length > 0 &&
                    changesByType.updated.every((c) =>
                      selectedChanges.has(c.flow.id),
                    )
                  }
                  onCheckedChange={handleSelectAll('updated')}
                  disabled={changesByType.updated.length === 0}
                />
                <span className="font-semibold">
                  Updated Flows ({changesByType.updated.length})
                </span>
              </button>
              {expandedSections.updated && (
                <div className="pl-8 pr-3 py-2 border-x border-b border-warning-200 space-y-1">
                  {changesByType.updated.length > 0 ? (
                    changesByType.updated.map((change) => (
                      <GitChange
                        key={change.flow.id}
                        change={change}
                        selected={selectedChanges.has(change.flow.id)}
                        onSelect={(checked) => {
                          setSelectedChanges((prev) => {
                            const newSet = new Set(prev);
                            if (checked) {
                              newSet.add(change.flow.id);
                            } else {
                              newSet.delete(change.flow.id);
                            }
                            return newSet;
                          });
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground py-2">
                      No updated flows
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg overflow-hidden">
              <button
                onClick={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    deleted: !prev.deleted,
                  }))
                }
                className="w-full flex items-center gap-2 p-3 bg-destructive-50/30 hover:bg-destructive-50/50 border-destructive-200 border text-destructive-700"
              >
                {expandedSections.deleted ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Checkbox
                  checked={
                    changesByType.deleted.length > 0 &&
                    changesByType.deleted.every((c) =>
                      selectedChanges.has(c.flow.id),
                    )
                  }
                  onCheckedChange={handleSelectAll('deleted')}
                  disabled={changesByType.deleted.length === 0}
                />
                <span className="font-semibold">
                  Deleted Flows ({changesByType.deleted.length})
                </span>
              </button>
              {expandedSections.deleted && (
                <div className="pl-8 pr-3 py-2 border-x border-b border-destructive-200 space-y-1">
                  {changesByType.deleted.length > 0 ? (
                    changesByType.deleted.map((change) => (
                      <GitChange
                        key={change.flow.id}
                        change={change}
                        selected={selectedChanges.has(change.flow.id)}
                        onSelect={(checked) => {
                          setSelectedChanges((prev) => {
                            const newSet = new Set(prev);
                            if (checked) {
                              newSet.add(change.flow.id);
                            } else {
                              newSet.delete(change.flow.id);
                            }
                            return newSet;
                          });
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground py-2">
                      No deleted flows
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="flex justify-end gap-1">
          {step === 2 && (
            <>
              <Button
                size={'sm'}
                variant={'outline'}
                onClick={() => {
                  setStep(1);
                  setSyncPlan(null);
                }}
              >
                {t('Back')}
              </Button>
              <Button
                size={'sm'}
                loading={isApplyingChanges}
                onClick={() => {
                  applyChanges();
                }}
              >
                {t('Apply Changes')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : (
    <ConnectGitDialog open={open} setOpen={setOpen} />
  );
};

export { GitReleaseDialog };
