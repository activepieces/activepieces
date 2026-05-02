import {
  ApErrorParams,
  ApFlagId,
  formErrors,
  PlatformWithoutSensitiveData,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';

type ConfigureSamlDialogProps = {
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  domainVerified: boolean;
  refetch: () => Promise<void>;
};

export const ConfigureSamlDialog = ({
  platform,
  connected,
  domainVerified,
  refetch,
}: ConfigureSamlDialogProps) => {
  const [open, setOpen] = useState(false);

  const { mutate: disableSaml, isPending: isDisabling } = useMutation({
    mutationFn: async () => {
      await platformApi.update(
        { federatedAuthProviders: { saml: null } },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Single sign-on settings updated'), { duration: 3000 });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {connected ? (
          <Button
            size="sm"
            className="text-destructive"
            variant="basic"
            loading={isDisabling}
            onClick={(e) => {
              disableSaml();
              e.preventDefault();
            }}
          >
            {t('Disable')}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="basic"
            disabled={!domainVerified}
            onClick={() => setOpen(true)}
          >
            {t('Enable')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        {open && (
          <SamlCredentialsForm
            platform={platform}
            refetch={refetch}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const SamlCredentialsFormValues = z.object({
  idpMetadata: z.string().min(1, formErrors.required),
  idpCertificate: z.string().min(1, formErrors.required),
});
type SamlCredentialsFormValues = z.infer<typeof SamlCredentialsFormValues>;

const SamlCredentialsForm = ({
  platform,
  refetch,
  onClose,
}: {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  onClose: () => void;
}) => {
  const form = useForm<SamlCredentialsFormValues>({
    resolver: zodResolver(SamlCredentialsFormValues),
    defaultValues: { idpMetadata: '', idpCertificate: '' },
    mode: 'onChange',
  });

  const { data: samlAcs } = flagsHooks.useFlag<string>(
    ApFlagId.SAML_AUTH_ACS_URL,
  );

  const { mutate: saveSaml, isPending } = useMutation({
    mutationFn: async (values: SamlCredentialsFormValues) => {
      await platformApi.update(
        {
          federatedAuthProviders: {
            saml: {
              idpMetadata: values.idpMetadata,
              idpCertificate: values.idpCertificate,
            },
          },
        },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Single sign-on settings updated'), { duration: 3000 });
      onClose();
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: extractServerErrorMessage(error, t('Save failed')),
      });
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Configure SAML 2.0 SSO')}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form
          className="grid space-y-4"
          onSubmit={form.handleSubmit((v) => saveSaml(v))}
        >
          {samlAcs && (
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
                { samlAcs },
              )}
            />
          )}

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
          {form.formState.errors.root?.serverError && (
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={!form.formState.isValid}
            >
              {t('Save')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

function extractServerErrorMessage(error: unknown, fallback: string): string {
  if (api.isError(error)) {
    const data = error.response?.data as ApErrorParams | undefined;
    const message =
      data?.params && 'message' in data.params
        ? data.params.message
        : undefined;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return fallback;
}
