import {
  GitBranchType,
  GitPushOperationType,
  PushGitRepoRequest,
} from '@activepieces/ee-shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { useForm } from 'react-hook-form';

import { gitSyncApi } from '../lib/git-sync-api';
import { gitSyncHooks } from '../lib/git-sync-hooks';

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

type PushToGitDialogProps = {
  flowId: string;
  children?: React.ReactNode;
};

const PushToGitDialog = ({ children, flowId }: PushToGitDialogProps) => {
  const [open, setOpen] = React.useState(false);

  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId(),
    platform.gitSyncEnabled,
  );
  const form = useForm<PushGitRepoRequest>({
    defaultValues: {
      type: GitPushOperationType.PUSH_FLOW,
      commitMessage: '',
      flowId,
    },
    resolver: typeboxResolver(PushGitRepoRequest),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (request: PushGitRepoRequest) => {
      console.log('SUBMIT');
      return gitSyncApi.push(gitSync?.id!, request);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Pushed successfully',
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
              <DialogTitle>Push to Git</DialogTitle>
              <DialogDescription>
                Enter a commit message to describe the changes you want to push.
              </DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="commitMessage"
              render={({ field }) => (
                <FormItem className="gap-2 flex flex-col">
                  <FormLabel>Commit Message</FormLabel>
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
                Push
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
