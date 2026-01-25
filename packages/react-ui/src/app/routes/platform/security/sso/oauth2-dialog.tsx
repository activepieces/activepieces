import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
import { platformApi } from '@/lib/platforms-api';
import {
  PlatformWithoutSensitiveData,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';

type NewOAuth2DialogProps = {
  providerName: 'google' | 'github' | 'oidc';
  providerDisplayName: string;
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  refetch: () => Promise<void>;
};

const BasicOAuth2FormValues = Type.Object({
  clientId: Type.String({
    minLength: 1,
  }),
  clientSecret: Type.String({
    minLength: 1,
  }),
});

const OidcFormValues = Type.Composite([
  BasicOAuth2FormValues,
  Type.Object({
    issuerUrl: Type.String({
      minLength: 1,
    }),
    scope: Type.Optional(Type.String()),
  }),
]);

type BasicOAuth2FormValues = Static<typeof BasicOAuth2FormValues>;
type OidcFormValues = Static<typeof OidcFormValues>;

export const NewOAuth2Dialog = ({
  providerDisplayName,
  providerName,
  platform,
  connected,
  refetch,
}: NewOAuth2DialogProps) => {
  const [open, setOpen] = useState(false);
  const schema = providerName === 'oidc' ? OidcFormValues : BasicOAuth2FormValues;
  const form = useForm<BasicOAuth2FormValues | OidcFormValues>({
    resolver: typeboxResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (request: UpdatePlatformRequestBody) => {
      await platformApi.update(request, platform.id);
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
            className="w-32 text-destructive"
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
          <Button
            size={'sm'}
            className="w-32"
            variant={'basic'}
            onClick={() => setOpen(true)}
          >
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
              'Read more information about how to configure {provider} SSO [here](https://www.activepieces.com/docs/security/sso).',
              { provider: providerDisplayName },
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
            {providerName === 'oidc' && (
              <FormField
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={'issuerUrl' as any}
                render={({ field }) => (
                  <FormItem className="grid space-y-4">
                    <Label htmlFor="issuerUrl">{t('Issuer URL')}</Label>
                    <Input
                      {...field}
                      required
                      id="issuerUrl"
                      className="rounded-sm"
                      placeholder="https://your-idp.com"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
            {providerName === 'oidc' && (
              <FormField
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={'scope' as any}
                render={({ field }) => (
                  <FormItem className="grid space-y-4">
                    <Label htmlFor="scope">{t('Scope')}</Label>
                    <Input
                      {...field}
                      id="scope"
                      className="rounded-sm"
                      placeholder="openid email profile"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
