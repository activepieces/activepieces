import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Info } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { gitSyncApi } from '@/features/git-sync/lib/git-sync-api';
import { gitSyncHooks } from '@/features/git-sync/lib/git-sync-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import {
  GitBranchType,
  GitPushOperationType,
  PushEverythingGitRepoRequest,
  PushGitRepoRequest,
} from '@activepieces/ee-shared';
import { assertNotNullOrUndefined } from '@activepieces/shared';

type PushEverythingDialogProps = {
  children?: React.ReactNode;
};

const PushEverythingDialog = (props: PushEverythingDialogProps) => {
  const [open, setOpen] = React.useState(false);

  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.plan.environmentsEnabled,
  );
  const form = useForm<PushGitRepoRequest>({
    defaultValues: {
      type: GitPushOperationType.PUSH_EVERYTHING,
      commitMessage: '',
    },
    resolver: typeboxResolver(PushEverythingGitRepoRequest),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (request: PushGitRepoRequest) => {
      assertNotNullOrUndefined(gitSync, 'gitSync');
      await gitSyncApi.push(gitSync.id, {
        type: GitPushOperationType.PUSH_EVERYTHING,
        commitMessage: request.commitMessage,
      });
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Everything is pushed successfully'),
        duration: 3000,
      });
      setOpen(false);
    },
  });

  if (!gitSync || gitSync.branchType !== GitBranchType.DEVELOPMENT) {
    return null;
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutate(data))}>
            <DialogHeader>
              <DialogTitle>{t('Push Everything to Git')}</DialogTitle>
            </DialogHeader>
            <FormField
              control={form.control}
              name="commitMessage"
              render={({ field }) => (
                <FormItem className="gap-2 flex flex-col">
                  <div className="flex items-center gap-2">
                    <FormLabel>{t('Commit Message')}</FormLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {t(
                          'Push all published flows, connections, and tables to the Git repository.',
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <div className="text-sm text-gray-500">
                    {t(
                      'Enter a commit message to describe the changes you want to push.',
                    )}
                  </div>
                </FormItem>
              )}
            />
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

PushEverythingDialog.displayName = 'PushEverythingDialog';
export { PushEverythingDialog };
