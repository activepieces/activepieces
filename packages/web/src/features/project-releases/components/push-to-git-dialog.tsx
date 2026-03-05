import {
  GitPushOperationType,
  PushGitRepoRequest,
  PushFlowsGitRepoRequest,
  PushTablesGitRepoRequest,
  assertNotNullOrUndefined,
  PopulatedFlow,
  Table,
} from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { t } from 'i18next';
import React from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { gitSyncHooks, gitSyncMutations } from '../hooks/git-sync-hooks';

type PushToGitDialogProps =
  | {
      type: 'flow';
      flows: PopulatedFlow[];
      children?: React.ReactNode;
    }
  | {
      type: 'table';
      tables: Table[];
      children?: React.ReactNode;
    };

const PushToGitDialog = (props: PushToGitDialogProps) => {
  const [open, setOpen] = React.useState(false);

  const showPushToGit = gitSyncHooks.useShowPushToGit();
  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.plan.environmentsEnabled,
  );
  const form = useForm<PushGitRepoRequest>({
    defaultValues: {
      type:
        props.type === 'flow'
          ? GitPushOperationType.PUSH_FLOW
          : GitPushOperationType.PUSH_TABLE,
      commitMessage: '',
      externalFlowIds:
        props.type === 'flow' ? props.flows.map((item) => item.externalId) : [],
      externalTableIds:
        props.type === 'table'
          ? props.tables.map((item) => item.externalId)
          : [],
    },
    resolver: typeboxResolver(
      props.type === 'flow'
        ? PushFlowsGitRepoRequest
        : PushTablesGitRepoRequest,
    ) as Resolver<PushGitRepoRequest>,
  });

  const { mutate: pushToGit, isPending } = gitSyncMutations.usePushToGit({
    onSuccess: () => {
      toast.success(t('Pushed successfully'), {
        duration: 3000,
      });
      setOpen(false);
    },
  });

  if (!showPushToGit) {
    return null;
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              assertNotNullOrUndefined(gitSync, 'gitSync');
              pushToGit({
                gitSyncId: gitSync.id,
                request:
                  props.type === 'flow'
                    ? {
                        type: GitPushOperationType.PUSH_FLOW,
                        commitMessage: data.commitMessage,
                        externalFlowIds: props.flows.map(
                          (item) => item.externalId,
                        ),
                      }
                    : {
                        type: GitPushOperationType.PUSH_TABLE,
                        commitMessage: data.commitMessage,
                        externalTableIds: props.tables.map(
                          (item) => item.externalId,
                        ),
                      },
              });
            })}
          >
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
                onClick={form.handleSubmit((data) => {
                  assertNotNullOrUndefined(gitSync, 'gitSync');
                  pushToGit({
                    gitSyncId: gitSync.id,
                    request:
                      props.type === 'flow'
                        ? {
                            type: GitPushOperationType.PUSH_FLOW,
                            commitMessage: data.commitMessage,
                            externalFlowIds: props.flows.map(
                              (item) => item.externalId,
                            ),
                          }
                        : {
                            type: GitPushOperationType.PUSH_TABLE,
                            commitMessage: data.commitMessage,
                            externalTableIds: props.tables.map(
                              (item) => item.externalId,
                            ),
                          },
                  });
                })}
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
