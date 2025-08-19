import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { INTERNAL_ERROR_MESSAGE, toast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  ConfigureRepoRequest,
  GitBranchType,
  GitRepo,
} from '@activepieces/ee-shared';
import { ApErrorParams, ErrorCode } from '@activepieces/shared';

import { gitSyncApi } from '../lib/git-sync-api';
import { gitSyncHooks } from '../lib/git-sync-hooks';

type ConnectGitProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  showButton?: boolean;
};

const ConnectGitDialog = ({ open, setOpen, showButton }: ConnectGitProps) => {
  const projectId = authenticationSession.getProjectId()!;
  const { platform } = platformHooks.useCurrentPlatform();

  const form = useForm<ConfigureRepoRequest>({
    defaultValues: {
      remoteUrl: '',
      projectId,
      branchType: GitBranchType.DEVELOPMENT,
      sshPrivateKey: '',
      slug: '',
      branch: '',
    },
    resolver: typeboxResolver(ConfigureRepoRequest),
  });

  const { refetch } = gitSyncHooks.useGitSync(
    projectId,
    platform.plan.environmentsEnabled,
  );

  const { mutate, isPending } = useMutation({
    mutationFn: (request: ConfigureRepoRequest): Promise<GitRepo> => {
      return gitSyncApi.configure(request);
    },
    onSuccess: (repo) => {
      refetch();
      toast({
        title: t('Success'),
        description: t('Connected successfully'),
        duration: 3000,
      });
    },
    onError: (error) => {
      let message = INTERNAL_ERROR_MESSAGE;

      if (api.isError(error)) {
        const responseData = error.response?.data as ApErrorParams;
        if (responseData.code === ErrorCode.INVALID_GIT_CREDENTIALS) {
          message = `Invalid git credentials, please check the credentials, \n ${responseData.params.message}`;
        }
      }
      form.setError('root.serverError', {
        message: message,
      });
      return;
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      {showButton && (
        <DialogTrigger asChild>
          <Button size={'sm'} className="w-32">
            {t('Connect Git')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <Form {...form}>
          <form
            className="flex flex-col"
            onSubmit={form.handleSubmit((data) => mutate(data))}
          >
            <DialogHeader>
              <DialogTitle>{t('Connect Git')}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="remoteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Remote URL')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="git@github.com:activepieces/activepieces.git"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Branch')}</FormLabel>
                    <FormControl>
                      <Input placeholder="main" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Folder')}</FormLabel>
                    <FormControl>
                      <Input placeholder="activepieces" {...field} />
                    </FormControl>
                    <FormDescription>
                      {t(
                        'Folder name is the name of the folder where the project will be stored or fetched.',
                      )}
                    </FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sshPrivateKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('SSH Private Key')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('The SSH private key to use for authentication.')}
                    </FormDescription>
                  </FormItem>
                )}
              />
              {form?.formState?.errors?.root?.serverError && (
                <FormMessage>
                  {form.formState.errors.root.serverError.message}
                </FormMessage>
              )}
            </div>

            <DialogFooter>
              <DialogClose>
                <Button type="button" variant={'outline'} loading={isPending}>
                  {t('Cancel')}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                onClick={form.handleSubmit((data) => mutate(data))}
                loading={isPending}
              >
                {t('Connect')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ConnectGitDialog.displayName = 'ConnectGitDialog';
export { ConnectGitDialog };
