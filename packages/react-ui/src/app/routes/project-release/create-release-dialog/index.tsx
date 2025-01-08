import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { AlertTriangle, ArrowRight, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { LoadingSpinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { gitSyncHooks } from '@/features/git-sync/lib/git-sync-hooks';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import {
  ConnectionOperationType,
  DiffReleaseRequest,
  ProjectReleaseType,
  ProjectSyncPlan,
} from '@activepieces/shared';

import { OperationChange } from './operation-change';

type CreateReleaseDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  refetch: () => void;
  diffRequest: DiffReleaseRequest;
  plan: ProjectSyncPlan;
  defaultName?: string;
  loading: boolean;
};

const formSchema = z.object({
  name: z.string().min(1, t('Name is required')),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const CreateReleaseDialog = ({
  open,
  setOpen,
  refetch,
  plan,
  loading,
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
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectAll = (checked: boolean) => {
    if (!plan) return;
    setSelectedChanges(
      new Set(checked ? plan.operations.map((op) => op.flow.id) : []),
    );
  };

  useEffect(() => {
    if (!loading && plan) {
      setSelectedChanges(
        new Set(plan.operations.map((op) => op.flow.id) || []),
      );
    }
  }, [loading, plan]);

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

        {loading && (
          <div className="flex items-center justify-center h-24">
            <LoadingSpinner />
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm" htmlFor="name">
                {t('Name')}
              </Label>
              <Input
                id="name"
                {...form.register('name')}
                onChange={(e) => {
                  if (e.target.value) {
                    setErrorMessage('');
                  }
                }}
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
                      const newSelectedChanges = new Set(selectedChanges);
                      if (checked) {
                        newSelectedChanges.add(operation.flow.id);
                      } else {
                        newSelectedChanges.delete(operation.flow.id);
                      }
                      setErrorMessage('');
                      setSelectedChanges(newSelectedChanges);
                    }}
                  />
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-2">
                  {t('No changes to apply')}
                </div>
              )}
            </div>
            {plan?.connections && plan?.connections.length > 0 && (
              <div className="mt-4 p-3 rounded-lg text-sm border flex gap-2">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <div className="font-semibold">
                    {t('Warning: Missing Connections')}
                  </div>
                  <div>
                    {t(
                      'The following connections need to be reconfigured in the',
                    )}
                    <span className="font-medium"> {t('Connections')}</span>
                    {t(' page after applying changes:')}
                  </div>
                  <div className="space-y-1.5">
                    {plan?.connections
                      ?.sort((a, b) =>
                        a.connectionState.displayName.localeCompare(
                          b.connectionState.displayName,
                        ),
                      )
                      .map((connection, index) => (
                        <div
                          key={connection.connectionState.externalId}
                          className="flex items-center gap-2"
                        >
                          {connection.type ===
                            ConnectionOperationType.UPDATE_CONNECTION && (
                            <div className="flex items-center gap-2">
                              <UpdateIcon className="w-4 h-4 shrink-0" />
                              <div className="flex items-center gap-1">
                                <div>
                                  {connection.connectionState.displayName}
                                </div>
                                <ArrowRight className="w-4 h-4 shrink-0" />
                                <div>
                                  {connection.newConnectionState.displayName}
                                </div>
                              </div>
                            </div>
                          )}
                          {connection.type ===
                            ConnectionOperationType.CREATE_CONNECTION && (
                            <>
                              <Plus className="w-4 h-4 shrink-0 text-success" />
                              <span className="text-success">
                                {connection.connectionState.displayName}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
          </div>
        )}

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
            disabled={isPending}
            onClick={() => {
              if (form.getValues('name').trim() === '') {
                setErrorMessage('Release name is required');
                return;
              }
              if (selectedChanges.size === 0) {
                setErrorMessage(
                  'Please select at least one change to include in the release',
                );
                return;
              }
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
