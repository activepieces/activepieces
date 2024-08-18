import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import {
  ConfigureRepoRequest,
  GitBranchType,
  GitRepo,
} from '@activepieces/ee-shared';

import { gitSyncApi } from '../lib/git-sync-api';
import { gitSyncHooks } from '../lib/git-sync-hooks';

const ConnectGitDialog = () => {
  const projectId = authenticationSession.getProjectId();
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
    platform.gitSyncEnabled,
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
      toast(INTERNAL_ERROR_TOAST);
      console.error(error);
    },
  });
  return (
    <Form {...form}>
      <form
        className="grid space-y-4"
        onSubmit={form.handleSubmit((data) => mutate(data))}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button size={'sm'} className="w-32">
              {t('Connect Git')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('Connect Git')}</DialogTitle>
              <DialogDescription>
                {t(
                  'Start by connecting an empty git repository to your project.',
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
            </div>

            <DialogFooter>
              <Button
                type="submit"
                onClick={form.handleSubmit((data) => mutate(data))}
                loading={isPending}
              >
                {t('Connect')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
};

ConnectGitDialog.displayName = 'ConnectGitDialog';
export { ConnectGitDialog };
