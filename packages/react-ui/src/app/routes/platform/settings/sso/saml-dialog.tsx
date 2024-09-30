import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { Textarea } from '@/components/ui/textarea';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformApi } from '@/lib/platforms-api';
import {
  ApFlagId,
  Platform,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';

type ConfigureSamlDialogProps = {
  platform: Platform;
  connected: boolean;
  refetch: () => Promise<void>;
};

const Saml2FormValues = Type.Object({
  idpMetadata: Type.String({
    minLength: 1,
  }),
  idpCertificate: Type.String({
    minLength: 1,
  }),
});
type Saml2FormValues = Static<typeof Saml2FormValues>;

export const ConfigureSamlDialog = ({
  platform,
  connected,
  refetch,
}: ConfigureSamlDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<Saml2FormValues>({
    resolver: typeboxResolver(Saml2FormValues),
  });

  const { data: samlAcs } = flagsHooks.useFlag<string>(
    ApFlagId.SAML_AUTH_ACS_URL,
  );
  const { mutate, isPending } = useMutation({
    mutationFn: async (request: UpdatePlatformRequestBody) => {
      await platformApi.update(request, platform.id);
      await refetch();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Single sign-on settings updated'),
        duration: 3000,
      });
      setOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
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
                  ...platform.federatedAuthProviders,
                  saml: undefined,
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
              mutate({
                federatedAuthProviders: {
                  ...platform.federatedAuthProviders,
                  saml: data,
                },
              });
            })}
          >
            <FormField
              name="idpMetadata"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
                  <Label htmlFor="idpMetadata">{t('IDP Metadata')}</Label>
                  <Input
                    {...field}
                    required
                    id="idpMetadata"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="idpCertificate"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
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
