import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useEffect } from 'react';

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
import { gitSyncApi } from '@/features/git-sync/lib/git-sync-api';
import { gitSyncHooks } from '@/features/git-sync/lib/git-sync-hooks';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import {
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

const GitReleaseDialog = ({
  open,
  setOpen,
  refetch,
}: GitReleaseDialogProps) => {
  const [syncPlan, setSyncPlan] = React.useState<ProjectSyncPlan | null>(null);
  const [releaseName, setReleaseName] = React.useState('');
  const [releaseDescription, setReleaseDescription] = React.useState('');
  const [step, setStep] = React.useState(1);
  const [isApplyingChanges, setIsApplyingChanges] = React.useState(false);
  const [checkedOperations, setCheckedOperations] = React.useState<
    Set<ProjectSyncPlanOperation>
  >(new Set());
  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.environmentEnabled,
  );

  useEffect(() => {
    if (syncPlan) {
      setCheckedOperations(new Set(syncPlan.operations));
    }
  }, [syncPlan]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (dryRun: boolean) => {
      if (releaseName.trim() === '') {
        toast({
          title: t('Release name is required'),
          description: t('Please enter a name for the release'),
          duration: 2000,
        });
        return;
      }
      if (gitSync) {
        return gitSyncApi.pull(gitSync.id, {
          dryRun,
          selectedOperations: Array.from(checkedOperations).map(
            (op) => op.flow.id,
          ),
        });
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

  const { mutate: applyChanges } = useMutation({
    mutationFn: async () => {
      setIsApplyingChanges(true);
      if (gitSync) {
        projectReleaseApi
          .create({
            name: releaseName,
            description: releaseDescription,
            selectedOperations: Array.from(checkedOperations).map(
              (op) => op.flow.id,
            ),
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

  const renderChangesWithCheckboxes = () => (
    <div className="flex flex-col gap-4">
      {syncPlan?.operations.map((operation, index) => (
        <div key={index} className="flex items-center gap-2">
          <Checkbox
            checked={checkedOperations.has(operation)}
            onCheckedChange={() => {
              const newChecked = new Set(checkedOperations);
              if (newChecked.has(operation)) {
                newChecked.delete(operation);
              } else {
                newChecked.add(operation);
              }
              setCheckedOperations(newChecked);
            }}
          />
          <GitChange change={operation} />
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create Git Release')}</DialogTitle>
          <DialogDescription>
            {t('These are the changes that will be applied to the project')}
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <Label className="text-sm">{t('Name')}</Label>
                <Input
                  value={releaseName}
                  onChange={(e) => setReleaseName(e.target.value)}
                  placeholder={t('Required')}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm">{t('Description')}</Label>
                <Textarea
                  value={releaseDescription}
                  onChange={(e) => setReleaseDescription(e.target.value)}
                  placeholder={t('Optional')}
                />
              </div>
            </div>
            <Button
              size={'sm'}
              loading={isPending}
              onClick={(e) => {
                mutate(true);
                e.preventDefault();
              }}
              className={syncPlan ? 'bg-green-500 text-white' : ''}
            >
              {t('Pull from Git')}
            </Button>
          </div>
        ) : (
          renderChangesWithCheckboxes()
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
  );
};

export { GitReleaseDialog };
