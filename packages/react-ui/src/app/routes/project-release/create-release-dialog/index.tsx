import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { PencilIcon, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  TableOperationType,
} from '@activepieces/shared';

import { OperationChange } from './operation-change';

type CreateReleaseDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  refetch: () => void;
  loading: boolean;
  diffRequest: DiffReleaseRequest;
  plan: ProjectSyncPlan;
  defaultName?: string;
};

const formSchema = z.object({
  name: z.string().min(1, t('Name is required')),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type CreateReleaseDialogContentProps = {
  form: UseFormReturn<FormData>;
  loading: boolean;
  diffRequest: DiffReleaseRequest;
  plan: ProjectSyncPlan;
  setOpen: (open: boolean) => void;
  refetch: () => void;
};

const CreateReleaseDialogContent = ({
  loading,
  diffRequest,
  plan,
  form,
  setOpen,
  refetch,
}: CreateReleaseDialogContentProps) => {
  const isThereAnyChanges =
    (plan?.operations && plan?.operations.length > 0) ||
    (plan?.tables && plan?.tables.length > 0);
  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.environmentsEnabled,
  );

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
            type: diffRequest.type,
            projectId: authenticationSession.getProjectId()!,
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
            projectId: authenticationSession.getProjectId()!,
          });
          break;
        case ProjectReleaseType.ROLLBACK:
          await projectReleaseApi.create({
            name: form.getValues('name'),
            description: form.getValues('description'),
            selectedFlowsIds: Array.from(selectedChanges),
            projectReleaseId: diffRequest.projectReleaseId,
            type: diffRequest.type,
            projectId: authenticationSession.getProjectId()!,
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

  return (
    <>
      {loading && (
        <div className="flex items-center justify-center h-24">
          <LoadingSpinner />
        </div>
      )}

      {!loading && isThereAnyChanges && (
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
                  form.setError('name', { message: '' });
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
          {plan?.operations && plan?.operations.length > 0 && (
            <div className="space-y-2 ">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 py-2 border-b">
                  <Checkbox
                    checked={selectedChanges.size === plan?.operations.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm font-medium">
                    {t('Flows Changes')} ({selectedChanges.size}/
                    {plan?.operations.length || 0})
                  </Label>
                </div>
              </div>
              <ScrollArea viewPortClassName="max-h-[15vh]">
                {plan?.operations.map((operation) => (
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
                ))}
              </ScrollArea>
            </div>
          )}
          {plan?.connections && plan?.connections.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col justify -center gap-1 py-2 border-b">
                  <Label className="text-sm font-medium">
                    {t('Connections Changes')} ({plan?.connections?.length || 0}
                    )
                  </Label>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      {t(
                        'New connections are placeholders and need to be reconnected again',
                      )}
                    </span>
                  </div>
                </div>
                <ScrollArea viewPortClassName="max-h-[16vh]">
                  {plan?.connections.map((connection, index) => (
                    <div
                      key={connection.connectionState.externalId}
                      className="flex items-center gap-2 text-sm py-1"
                    >
                      {connection.type ===
                        ConnectionOperationType.UPDATE_CONNECTION && (
                        <div className="flex items-center gap-2">
                          <PencilIcon className="w-4 h-4 shrink-0" />
                          <div className="flex items-center gap-1">
                            <span>
                              {connection.connectionState.displayName}
                            </span>
                            <span> {t('renamed to')} </span>
                            <span>
                              {connection.newConnectionState.displayName}
                            </span>
                          </div>
                        </div>
                      )}
                      {connection.type ===
                        ConnectionOperationType.CREATE_CONNECTION && (
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 shrink-0 text-success" />
                          <span className="text-success">
                            {connection.connectionState.displayName}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          )}

          {plan?.tables && plan?.tables.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col justify -center gap-1 py-2 border-b">
                  <Label className="text-sm font-medium">
                    {t('Tables Changes')} ({plan?.tables?.length || 0})
                  </Label>
                </div>
                <ScrollArea viewPortClassName="max-h-[16vh]">
                  {plan?.tables.map((table, index) => (
                    <div
                      key={table.tableState.id}
                      className="flex items-center gap-2 text-sm py-1"
                    >
                      {table.type === TableOperationType.UPDATE_TABLE && (
                        <div className="flex items-center gap-2">
                          <PencilIcon className="w-4 h-4 shrink-0" />
                          <div className="flex items-center gap-1">
                            <span>{table.tableState.name}</span>
                          </div>
                        </div>
                      )}
                      {table.type === TableOperationType.CREATE_TABLE && (
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 shrink-0 text-success" />
                          <span className="text-success">
                            {table.tableState.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          )}
          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
        </div>
      )}

      {loading ||
        (!loading && !isThereAnyChanges && (
          <div className="text-sm py-2">{t('No changes to apply')}</div>
        ))}

      {!loading && isThereAnyChanges && (
        <DialogFooter className=" items-end gap-1 ">
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
              let error = false;
              if (form.getValues('name').trim() === '') {
                form.setError('name', { message: 'Release name is required' });
                error = true;
              }
              if (selectedChanges.size === 0 && plan.tables.length === 0) {
                setErrorMessage(
                  'Please select at least one change to include in the release',
                );
                error = true;
              }
              if (error) {
                return;
              }
              applyChanges();
            }}
          >
            {t('Apply Changes')}
          </Button>
        </DialogFooter>
      )}
    </>
  );
};

const CreateReleaseDialog = ({
  open,
  setOpen,
  refetch,
  plan,
  loading,
  defaultName = '',
  diffRequest,
}: CreateReleaseDialogProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultName,
      description: '',
    },
  });

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
      <DialogContent className="min-h-[100px] max-h-[720px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {diffRequest.type === ProjectReleaseType.GIT
              ? t('Create Git Release')
              : diffRequest.type === ProjectReleaseType.PROJECT
              ? t('Create Project Release')
              : `${t('Create Rollback to')} ${form.getValues('name')}`}
          </DialogTitle>
        </DialogHeader>

        <CreateReleaseDialogContent
          key={`${loading}`}
          loading={loading}
          diffRequest={diffRequest}
          plan={plan}
          form={form}
          setOpen={setOpen}
          refetch={refetch}
        />
      </DialogContent>
    </Dialog>
  );
};

export { CreateReleaseDialog };
