import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { gitSyncHooks } from '@/features/git-sync/lib/git-sync-hooks';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { ProjectSyncPlan } from '@activepieces/ee-shared';
import { DiffReleaseRequest, ProjectReleaseType } from '@activepieces/shared';

import { OperationChange } from './operation-change';

type CreateReleaseDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  refetch: () => void;
  diffRequest: DiffReleaseRequest;
  plan: ProjectSyncPlan | undefined;
  defaultName?: string;
};

const formSchema = z.object({
  name: z.string().min(1, t('Name is required')),
  description: z.string(),
});

type FormData = z.infer<typeof formSchema>;

const CreateReleaseDialog = ({
  open,
  setOpen,
  refetch,
  plan,
  defaultName = '',
  diffRequest,
}: CreateReleaseDialogProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.environmentsEnabled,
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultName,
      description: '',
    },
  });

  const { mutate: applyChanges, isPending } = useMutation({
    mutationFn: async () => {
      switch (diffRequest.type) {
        case ProjectReleaseType.GIT:
          if (!gitSync) {
            throw new Error('Git sync is not connected');
          }
          await projectReleaseApi.create({
            name: form.getValues('name'),
            description: form.getValues('description'),
            selectedFlowsIds: Array.from(selectedChanges),
            repoId: gitSync.id,
            type: diffRequest.type,
          });
          break;
        case ProjectReleaseType.PROJECT:
          if (!diffRequest.targetProjectId) {
            throw new Error('Project ID is required');
          }
          await projectReleaseApi.create({
            name: form.getValues('name'),
            description: form.getValues('description'),
            selectedFlowsIds: Array.from(selectedChanges),
            targetProjectId: diffRequest.targetProjectId,
            type: diffRequest.type,
          });
          break;
        case ProjectReleaseType.ROLLBACK:
          await projectReleaseApi.create({
            name: form.getValues('name'),
            description: form.getValues('description'),
            selectedFlowsIds: Array.from(selectedChanges),
            projectReleaseId: diffRequest.projectReleaseId,
            type: diffRequest.type,
          });
          break;
      }
    },
    onSuccess: () => {
      refetch();
      setOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(
    new Set(plan?.operations.map((op) => op.flow.id) || []),
  );

  const handleSelectAll = (checked: boolean) => {
    if (!plan) return;
    setSelectedChanges(
      new Set(checked ? plan.operations.map((op) => op.flow.id) : []),
    );
  };

  return (
    <Dialog
      modal={true}
      open={open}
      onOpenChange={(newOpenState: boolean) => {
        if (newOpenState) {
          form.reset({
            name: defaultName,
            description: '',
          });
        }
        setOpen(newOpenState);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {diffRequest.type === ProjectReleaseType.GIT
              ? t('Create Git Release')
              : diffRequest.type === ProjectReleaseType.PROJECT
              ? t('Create Project Release')
              : t('Rollback Release')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label className="text-sm" htmlFor="name">
              {t('Name')}
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder={t('Meeting Summary Flow')}
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
              placeholder={t('Added new features and fixed bugs')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 py-2 border-b">
                <Checkbox
                  checked={selectedChanges.size === plan?.operations.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm font-medium">
                  {t('Changes')} ({selectedChanges.size}/
                  {plan?.operations.length || 0})
                </Label>
              </div>
            </div>
            {plan?.operations.length ? (
              plan.operations.map((operation) => (
                <OperationChange
                  key={operation.flow.id}
                  change={operation}
                  selected={selectedChanges.has(operation.flow.id)}
                  onSelect={(checked) => {
                    setSelectedChanges(
                      new Set(
                        checked
                          ? [...selectedChanges, operation.flow.id]
                          : [...selectedChanges].filter(
                              (id) => id !== operation.flow.id,
                            ),
                      ),
                    );
                  }}
                />
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                {t('No changes to apply')}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-1">
          <Button
            size={'sm'}
            variant={'outline'}
            onClick={() => setOpen(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            size={'sm'}
            loading={isPending}
            disabled={!form.formState.isValid || selectedChanges.size === 0}
            onClick={() => {
              applyChanges();
            }}
          >
            {t('Apply Changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { CreateReleaseDialog };
