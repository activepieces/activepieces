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
  DialogDescription,
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
import { assertNotNullOrUndefined } from '@activepieces/shared';

import { gitSyncApi } from '../lib/git-sync-api';
import { gitSyncHooks } from '../lib/git-sync-hooks';

type PushToGitDialogProps = {
  flowIds: string[];
  children?: React.ReactNode;
};

const PushToGitDialog = ({ children, flowIds }: PushToGitDialogProps) => {
  const [open, setOpen] = React.useState(false);

  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.gitSyncEnabled,
  );

  const form = useForm<PushGitRepoRequest>({
    defaultValues: {
      type: GitPushOperationType.PUSH_FLOW,
      commitMessage: '',
      flowId: '',
    },
    resolver: typeboxResolver(PushGitRepoRequest),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (request: PushGitRepoRequest) => {
      assertNotNullOrUndefined(gitSync, 'gitSync');
      await Promise.all(
        flowIds.map((flowId) =>
          gitSyncApi.push(gitSync.id, { ...request, flowId }),
        ),
      );
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Pushed successfully'),
        duration: 3000,
      });
      setOpen(false);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
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
              <DialogDescription>
                {t(
                  'Enter a commit message to describe the changes you want to push.',
                )}
              </DialogDescription>
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
            <DialogFooter>
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
