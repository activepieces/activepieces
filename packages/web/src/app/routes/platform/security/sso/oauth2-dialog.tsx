import {
  ApFlagId,
  PlatformWithoutSensitiveData,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authClient } from '@/lib/better-auth';

type NewOAuth2DialogProps = {
  providerName: 'google' | 'github';
  providerDisplayName: string;
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  refetch: () => Promise<void>;
};

const OAuth2FormValues = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});
type OAuth2FormValues = z.infer<typeof OAuth2FormValues>;

export const NewOAuth2Dialog = ({
  providerDisplayName,
  providerName,
  platform,
  connected,
  refetch,
}: NewOAuth2DialogProps) => {
  const [open, setOpen] = useState(false);
  const { data: redirectUrl } = flagsHooks.useFlag<string>(
    ApFlagId.BETTER_AUTH_SSO_REDIRECT_URL,
  );
  const form = useForm<OAuth2FormValues>({
    resolver: zodResolver(OAuth2FormValues),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (request: UpdatePlatformRequestBody) => {
      await platformApi.update(request, platform.id);
      const googleConfig = request.federatedAuthProviders?.google;
      if (googleConfig && providerName === 'google') {
        await authClient.sso.register({
          providerId: `${providerName}-${platform.id}`,
          issuer: 'https://accounts.google.com',
          domain: `platform-${platform.id}`,
          oidcConfig: {
            clientId: googleConfig.clientId,
            clientSecret: googleConfig.clientSecret,
            scopes: ['openid', 'email', 'profile'],
          },
        });
      }
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Single sign on settings updated'), {
        duration: 3000,
      });
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        {connected ? (
          <Button
            size={'sm'}
            className="text-destructive"
            variant={'basic'}
            loading={isPending}
            onClick={(e) => {
              mutate({
                federatedAuthProviders: {
                  [providerName]: null,
                },
              });
              e.preventDefault();
            }}
          >
            {t('Disable')}
          </Button>
        ) : (
          <Button size={'sm'} variant={'basic'} onClick={() => setOpen(true)}>
            {t('Enable')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('Configure {provider} SSO', { provider: providerDisplayName })}
          </DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <ApMarkdown
            markdown={t(
              `Read more information about how to configure {provider} SSO [here](https://www.activepieces.com/docs/admin-guide/guides/sso).

**Authorized redirect URI**:
\`\`\`text
{redirectUrl}
\`\`\``,
              { provider: providerDisplayName, redirectUrl: redirectUrl ?? '' },
            )}
          />
        </div>

        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={form.handleSubmit((data) => {
              mutate({
                federatedAuthProviders: {
                  [providerName]: data,
                },
              });
            })}
          >
            <FormField
              name="clientId"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
                  <Label htmlFor="clientId">
                    {t('{provider} Client ID', {
                      provider: providerDisplayName,
                    })}
                  </Label>
                  <Input
                    {...field}
                    required
                    id="clientId"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="clientSecret"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
                  <Label htmlFor="clientSecret">
                    {t('{provider} Client Secret', {
                      provider: providerDisplayName,
                    })}
                  </Label>
                  <Input
                    {...field}
                    required
                    type="password"
                    id="clientSecret"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button
                loading={isPending}
                disabled={!form.formState.isValid}
                type="submit"
              >
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
