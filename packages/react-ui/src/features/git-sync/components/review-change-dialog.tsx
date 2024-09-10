import { UpdateIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Minus, Plus } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import {
  GitRepo,
  ProjectOperationType,
  ProjectSyncPlan,
  ProjectSyncPlanOperation,
} from '@activepieces/ee-shared';

import { gitSyncApi } from '../lib/git-sync-api';

type GitChangeProps = {
  change: ProjectSyncPlanOperation;
};
const GitChange = React.memo(({ change }: GitChangeProps) => {
  return (
    <>
      {change.type === ProjectOperationType.CREATE_FLOW && (
        <div className="flex gap-4 text-success-300 justify-center items-center">
          <Plus className="w-4 h-4"></Plus>
          <span className="flex-grow items-center justify-center">
            {t('Create &quot;{flowName}&quot; Flow', {
              flowName: change.flow.displayName,
            })}
          </span>
        </div>
      )}
      {change.type === ProjectOperationType.UPDATE_FLOW && (
        <div className="flex gap-4 text-warn-dark justify-center items-center">
          <UpdateIcon className="w-4 h-4"></UpdateIcon>
          <span className="flex-grow items-center justify-center">
            {t('Update &quot;{flowName}&quot; Flow', {
              flowName: change.targetFlow.displayName,
            })}
          </span>
        </div>
      )}
      {change.type === ProjectOperationType.DELETE_FLOW && (
        <div className="flex gap-4 text-destructive-300 justify-center items-center">
          <Minus className="w-4 h-4"></Minus>
          <span className="flex-grow items-center justify-center">
            {t('Delete &quot;{flowName}&quot; Flow', {
              flowName: change.flow.displayName,
            })}
          </span>
        </div>
      )}
    </>
  );
});
GitChange.displayName = 'GitChange';

type ReviewChangeDialogProps = {
  gitSync: GitRepo;
};
const ReviewChangeDialog = ({ gitSync }: ReviewChangeDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const [syncPlan, setSyncPlan] = React.useState<ProjectSyncPlan | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: (dryRun: boolean) =>
      gitSyncApi.pull(gitSync.id, {
        dryRun,
      }),
    onSuccess: (plan) => {
      if (!open) {
        if (plan.operations.length === 0) {
          toast({
            title: t('No changes to pull'),
            description: t('There are no changes to pull'),
            duration: 3000,
          });
          setSyncPlan(null);
        } else {
          setSyncPlan(plan);
          setOpen(true);
        }
      } else {
        toast({
          title: t('Pulled changes'),
          description: t('Changes are applied successfully'),
          duration: 3000,
        });
        setOpen(false);
      }
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={'sm'}
          loading={isPending && !open}
          onClick={(e) => {
            mutate(true);
            e.preventDefault();
          }}
        >
          {t('Pull from Git')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Review Changes')}</DialogTitle>
          <DialogDescription>
            {t('These are the changes that will be pulled from the repository')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea>
          <div className="flex flex-col gap-4">
            {syncPlan?.operations.map((operation, index) => (
              <GitChange change={operation} key={index}></GitChange>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            size={'sm'}
            variant={'outline'}
            disabled={isPending}
            onClick={() => {
              setOpen(false);
            }}
          >
            {t('Close')}
          </Button>
          <Button
            size={'sm'}
            loading={isPending}
            onClick={(e) => {
              mutate(false);
              e.preventDefault();
            }}
          >
            {t('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ReviewChangeDialog };
