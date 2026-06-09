import {
  ApErrorParams,
  ApFlagId,
  PlatformWithoutSensitiveData,
  SsoDomainVerification,
  SsoDomainVerificationRecord,
  SsoDomainVerificationStatus,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { CheckCircle, Loader2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { ApMarkdown } from '@/components/custom/markdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export const ConfigureSamlDialog = ({
  platform,
  connected,
  refetch,
}: ConfigureSamlDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="basic" onClick={() => setOpen(true)}>
          {connected ? t('Edit') : t('Enable')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {open && (
          <SamlWizard
            key={open ? 'open' : 'closed'}
            platform={platform}
            connected={connected}
            refetch={refetch}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const SamlWizard = ({
  platform,
  connected,
  refetch,
  onClose,
}: {
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  refetch: () => Promise<void>;
  onClose: () => void;
}) => {
  const domainVerified =
    platform.ssoDomainVerification?.status ===
    SsoDomainVerificationStatus.VERIFIED;
  const [step, setStep] = useState<WizardStep>(
    connected || !domainVerified ? 'domain' : 'saml',
  );

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
      onClose();
    },
  });

  const disableAction = connected
    ? { onDisable: () => disableSaml(), isDisabling }
    : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Configure SAML 2.0 SSO')}</DialogTitle>
      </DialogHeader>
      <StepIndicator step={step} />
      <div className={cn(step !== 'domain' && 'hidden')}>
        <DomainStep
          platform={platform}
          refetch={refetch}
          onVerified={() => setStep('saml')}
          onNext={() => setStep('saml')}
          canProceed={domainVerified}
          disableAction={disableAction}
        />
      </div>
      <div className={cn(step !== 'saml' && 'hidden')}>
        <SamlStep
          platform={platform}
          refetch={refetch}
          onBack={() => setStep('domain')}
          onClose={onClose}
          disableAction={disableAction}
        />
      </div>
    </>
  );
};

const StepIndicator = ({ step }: { step: WizardStep }) => (
  <div className="flex items-center gap-3 text-xs text-muted-foreground">
    <div
      className={cn(
        'flex items-center gap-2',
        step === 'domain' && 'text-foreground font-medium',
      )}
    >
      <span
        className={cn(
          'flex size-5 items-center justify-center rounded-full border text-xs',
          step === 'domain'
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/40',
        )}
      >
        1
      </span>
      {t('SSO Domain')}
    </div>
    <div className="h-px w-6 bg-muted-foreground/30" />
    <div
      className={cn(
        'flex items-center gap-2',
        step === 'saml' && 'text-foreground font-medium',
      )}
    >
      <span
        className={cn(
          'flex size-5 items-center justify-center rounded-full border text-xs',
          step === 'saml'
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/40',
        )}
      >
        2
      </span>
      {t('SAML 2.0')}
    </div>
  </div>
);

const DomainStep = ({
  platform,
  refetch,
  onVerified,
  onNext,
  canProceed,
  disableAction,
}: {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  onVerified: () => void;
  onNext: () => void;
  canProceed: boolean;
  disableAction: DisableAction;
}) => {
  const form = useForm<SsoDomainFormValues>({
    resolver: zodResolver(SsoDomainFormValues),
    defaultValues: { ssoDomain: platform.ssoDomain ?? '' },
    mode: 'onChange',
  });
  const verification = platform.ssoDomainVerification ?? null;
  const ssoDomainValue = form.watch('ssoDomain');
  const isDirty =
    ssoDomainValue.trim().toLowerCase() !== (platform.ssoDomain ?? '');
  const [showUpdateWarning, setShowUpdateWarning] = useState(false);

  const { mutate: saveDomain, isPending: isSaving } = useMutation({
    mutationFn: async (values: SsoDomainFormValues) => {
      await samlSsoApi.updateSsoDomain(values.ssoDomain.trim().toLowerCase());
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('SSO domain saved'));
      setShowUpdateWarning(false);
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: extractServerErrorMessage(error, t("Couldn't save domain")),
      });
      setShowUpdateWarning(false);
    },
  });

  const { mutate: verifyDomain, isPending: isVerifying } = useMutation({
    mutationFn: async () => {
      const result = await samlSsoApi.verifySsoDomain();
      await refetch();
      return result;
    },
    onSuccess: (result) => {
      if (
        result.ssoDomainVerification?.status ===
        SsoDomainVerificationStatus.VERIFIED
      ) {
        toast.success(t('Domain verified'));
        onVerified();
      } else {
        toast.message(
          t('TXT record not found yet — DNS can take a few minutes.'),
        );
      }
    },
    onError: (error) => {
      toast.error(
        extractServerErrorMessage(error, t("Couldn't verify domain")),
      );
    },
  });

  const handleSubmit = (values: SsoDomainFormValues) => {
    if (platform.ssoDomain) {
      setShowUpdateWarning(true);
      return;
    }
    saveDomain(values);
  };

  return (
    <Form {...form}>
      <form
        className="grid space-y-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          name="ssoDomain"
          render={({ field }) => (
            <FormItem className="grid space-y-2">
              <Label htmlFor="ssoDomain">{t('Domain')}</Label>
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

        {verification && !isDirty && (
          <DomainVerificationPanel
            verification={verification}
            isVerifying={isVerifying}
            onVerify={() => verifyDomain()}
          />
        )}

        {form.formState.errors.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}

        <DialogFooter>
          {disableAction && (
            <Button
              type="button"
              variant="basic"
              className="text-destructive"
              loading={disableAction.isDisabling}
              onClick={disableAction.onDisable}
            >
              {t('Disable')}
            </Button>
          )}
          {isDirty ? (
            <Button
              type="submit"
              loading={isSaving}
              disabled={!form.formState.isValid}
            >
              {platform.ssoDomain ? t('Update domain') : t('Save domain')}
            </Button>
          ) : (
            <Button type="button" onClick={onNext} disabled={!canProceed}>
              {t('Next')}
            </Button>
          )}
        </DialogFooter>
      </form>
      <Dialog open={showUpdateWarning} onOpenChange={setShowUpdateWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Update SSO domain?')}</DialogTitle>
          </DialogHeader>
          <Alert variant="warning">
            <TriangleAlert className="size-4" />
            <AlertDescription>
              {t(
                "Users won't be able to sign in via SSO until you verify the new domain.",
              )}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={isSaving}
              onClick={() => setShowUpdateWarning(false)}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              loading={isSaving}
              onClick={() => saveDomain(form.getValues())}
            >
              {t('Update domain')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
};

const SamlStep = ({
  platform,
  refetch,
  onBack,
  onClose,
  disableAction,
}: {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  onBack: () => void;
  onClose: () => void;
  disableAction: DisableAction;
}) => {
  const form = useForm<Saml2FormValues>({
    resolver: zodResolver(Saml2FormValues),
    defaultValues: { idpMetadata: '', idpCertificate: '' },
    mode: 'onChange',
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
      toast.success(t('Single sign-on settings updated'), { duration: 3000 });
      onClose();
    },
  });

  return (
    <>
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
            mutate({ federatedAuthProviders: { saml: data } });
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
            {disableAction && (
              <Button
                type="button"
                variant="basic"
                className="text-destructive mr-auto"
                loading={disableAction.isDisabling}
                onClick={disableAction.onDisable}
              >
                {t('Disable')}
              </Button>
            )}
            <Button variant="outline" type="button" onClick={onBack}>
              {t('Back')}
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
    </>
  );
};

const DomainVerificationPanel = ({
  verification,
  isVerifying,
  onVerify,
}: {
  verification: SsoDomainVerification;
  isVerifying: boolean;
  onVerify: () => void;
}) => {
  const verified = verification.status === SsoDomainVerificationStatus.VERIFIED;
  return (
    <div className="flex flex-col gap-3">
      <VerificationStatusBadge status={verification.status} />
      {!verified && (
        <>
          <p className="text-xs text-muted-foreground">
            {t(
              "Add this TXT record at your DNS provider. We'll detect it once it propagates — this usually takes a few minutes.",
            )}
          </p>
          <VerificationRecordRow record={verification.record} />
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={isVerifying}
              onClick={onVerify}
            >
              {t('Verify DNS')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const VerificationStatusBadge = ({
  status,
}: {
  status: SsoDomainVerificationStatus;
}) => {
  if (status === SsoDomainVerificationStatus.VERIFIED) {
    return (
      <div className="flex items-center gap-2 text-sm text-success-600">
        <CheckCircle className="size-4" />
        {t('DNS verified — domain is ready')}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm text-warning">
      <Loader2 className="size-4 animate-spin" />
      {t('Waiting for DNS')}
    </div>
  );
};

const VerificationRecordRow = ({
  record,
}: {
  record: SsoDomainVerificationRecord;
}) => (
  <div className="flex flex-col gap-2 rounded-md border p-4">
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">
        {record.type}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5 min-w-0">
        <Label className="text-xs text-muted-foreground">{t('Name')}</Label>
        <CopyToClipboardInput textToCopy={record.name} useInput={true} />
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        <Label className="text-xs text-muted-foreground">{t('Value')}</Label>
        <CopyToClipboardInput textToCopy={record.value} useInput={true} />
      </div>
    </div>
  </div>
);

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

const SsoDomainFormValues = z.object({
  ssoDomain: z
    .hostname('invalidSsoDomain')
    .max(253, 'invalidSsoDomain')
    .refine((v) => v.includes('.'), 'invalidSsoDomain'),
});
type SsoDomainFormValues = z.infer<typeof SsoDomainFormValues>;

const Saml2FormValues = z.object({
  idpMetadata: z.string().min(1),
  idpCertificate: z.string().min(1),
});
type Saml2FormValues = z.infer<typeof Saml2FormValues>;

type WizardStep = 'domain' | 'saml';

type DisableAction = {
  onDisable: () => void;
  isDisabling: boolean;
} | null;

type ConfigureSamlDialogProps = {
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  refetch: () => Promise<void>;
};
