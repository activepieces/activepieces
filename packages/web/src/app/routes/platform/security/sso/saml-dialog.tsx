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
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { samlSsoApi } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';

type ConfigureSamlDialogProps = {
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  refetch: () => Promise<void>;
};

const Saml2FormValues = z.object({
  idpMetadata: z.string().min(1),
  idpCertificate: z.string().min(1),
  ssoDomain: z.union([
    z
      .hostname('invalidSsoDomain')
      .max(253, 'invalidSsoDomain')
      .refine((v) => v.includes('.'), 'invalidSsoDomain'),
    z.literal(''),
  ]),
});
type Saml2FormValues = z.infer<typeof Saml2FormValues>;

export const ConfigureSamlDialog = ({
  platform,
  connected,
  refetch,
}: ConfigureSamlDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<Saml2FormValues>({
    resolver: zodResolver(Saml2FormValues),
    defaultValues: {
      idpMetadata: '',
      idpCertificate: '',
      ssoDomain: platform.plan.ssoDomain ?? '',
    },
    mode: 'onChange',
  });

  const { data: samlAcs } = flagsHooks.useFlag<string>(
    ApFlagId.SAML_AUTH_ACS_URL,
  );

  const { mutate: saveSaml, isPending: isSavingSaml } = useMutation({
    mutationFn: async ({
      request,
      ssoDomain,
    }: {
      request: UpdatePlatformRequestBody;
      ssoDomain: string | null;
    }) => {
      await platformApi.update(request, platform.id);
      await samlSsoApi.updateSsoDomain(ssoDomain);
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Single sign-on settings updated'), {
        duration: 3000,
      });
      setOpen(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t('Save failed');
      form.setError('root.serverError', { type: 'manual', message });
    },
  });

  const { mutate: disableSaml, isPending: isDisabling } = useMutation({
    mutationFn: async () => {
      await platformApi.update(
        { federatedAuthProviders: { saml: null } },
        platform.id,
      );
      await samlSsoApi.updateSsoDomain(null);
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Single sign-on settings updated'), {
        duration: 3000,
      });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset({
            idpMetadata: '',
            idpCertificate: '',
            ssoDomain: platform.plan.ssoDomain ?? '',
          });
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        {connected ? (
          <Button
            size={'sm'}
            className="text-destructive"
            variant={'basic'}
            loading={isDisabling}
            onClick={(e) => {
              disableSaml();
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
          <DialogTitle>{t('Configure SAML 2.0 SSO')}</DialogTitle>
        </DialogHeader>
        {samlAcs && (
          <div className="mb-4">
            <ApMarkdown
              markdown={t(
                `
**Setup Instructions**:
Please check the following documentation: [SAML SSO](https://activepieces.com/docs/security/sso)

**Single sign-on URL**:
\`\`\`text
{samlAcs}
\`\`\`
**Audience URI (SP Entity ID)**:
\`\`\`text
Activepieces
\`\`\`
`,
                { samlAcs: samlAcs ?? '' },
              )}
            />
          </div>
        )}

        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={form.handleSubmit((data) => {
              const trimmed = data.ssoDomain.trim().toLowerCase();
              saveSaml({
                request: {
                  federatedAuthProviders: {
                    saml: {
                      idpMetadata: data.idpMetadata,
                      idpCertificate: data.idpCertificate,
                    },
                  },
                },
                ssoDomain: trimmed.length === 0 ? null : trimmed,
              });
            })}
          >
            <FormField
              name="idpMetadata"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="idpMetadata">{t('IDP Metadata')}</Label>
                  <Textarea
                    {...field}
                    required
                    id="idpMetadata"
                    rows={6}
                    className="rounded-sm font-mono text-xs"
                  />
                  <FormDescription>
                    {t(
                      'Paste the metadata XML contents or the metadata URL provided by your identity provider.',
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="idpCertificate"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="idpCertificate">{t('IDP Certificate')}</Label>
                  <Textarea
                    {...field}
                    required
                    id="idpCertificate"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="ssoDomain"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="ssoDomain">{t('SSO Domain')}</Label>
                  <Input
                    {...field}
                    id="ssoDomain"
                    placeholder="acme.com"
                    className="rounded-sm"
                  />
                  <FormDescription>
                    {t(
                      'When a user enters this domain on the sign-in page, they will be redirected to your SAML identity provider.',
                    )}
                  </FormDescription>
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
                loading={isSavingSaml}
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
