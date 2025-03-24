import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import {
  GitBranchType,
  GitPushOperationType,
  PushGitRepoRequest,
} from '@activepieces/ee-shared';
import {
  assertNotNullOrUndefined,
  ErrorCode,
  PopulatedFlow,
} from '@activepieces/shared';

import { gitSyncApi } from '../lib/git-sync-api';
import { gitSyncHooks } from '../lib/git-sync-hooks';

type PushToGitDialogProps = {
  flows: PopulatedFlow[];
  children?: React.ReactNode;
};

const PushToGitDialog = ({ children, flows }: PushToGitDialogProps) => {
  const [open, setOpen] = React.useState(false);

  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.environmentsEnabled,
  );
  const form = useForm<PushGitRepoRequest>({
    defaultValues: {
      type: GitPushOperationType.PUSH_FLOW,
      commitMessage: '',
      flowIds: [],
    },
    resolver: typeboxResolver(PushGitRepoRequest),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (request: PushGitRepoRequest) => {
      assertNotNullOrUndefined(gitSync, 'gitSync');
      await gitSyncApi.push(gitSync.id, {
        ...request,
        flowIds: flows.map((flow) => flow.id),
      });
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Pushed successfully'),
        duration: 3000,
      });
      setOpen(false);
    },
    onError: (error: any) => {
      if (error.response.data.code === ErrorCode.FLOW_OPERATION_INVALID) {
        toast({
          title: t('Invalid Operation'),
          description: error.response.data.params.message,
          duration: 3000,
        });
      } else {
        toast(INTERNAL_ERROR_TOAST);
      }
    },
  });

  if (!gitSync || gitSync.branchType !== GitBranchType.DEVELOPMENT) {
    return null;
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutate(data))}>
            <DialogHeader>
              <DialogTitle>{t('Push to Git')}</DialogTitle>
            </DialogHeader>
            <FormField
              control={form.control}
              name="commitMessage"
              render={({ field }) => (
                <FormItem className="gap-2 flex flex-col">
                  <FormLabel>{t('Commit Message')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="text-sm text-gray-500 mt-2">
              {t(
                'Enter a commit message to describe the changes you want to push.',
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
              >
                {t('Cancel')}
              </Button>
              <Button
                type="submit"
                loading={isPending}
                onClick={form.handleSubmit((data) => mutate(data))}
              >
                {t('Push')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

PushToGitDialog.displayName = 'PushToGitDialog';
export { PushToGitDialog };
