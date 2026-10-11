import {
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
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import {
  ConfirmDialog,
  StatusDot,
  adminLayout,
  useAdminAction,
} from '@/app/components/admin';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
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
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';
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
        <Button
          {...adminControl(AdminControl.SSO_SAML_OPEN)}
          size="sm"
          variant="basic"
          onClick={() => setOpen(true)}
        >
          {connected ? t('Edit') : t('Enable')}
        </Button>
      </DialogTrigger>
      <DialogContent className={adminLayout.dialog.md}>
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

  const disableSaml = useAdminAction({
    verb: 'turnOff',
    name: t('SAML sign-in'),
    run: async () => {
      await platformApi.update(
        { federatedAuthProviders: { saml: null } },
        platform.id,
      );
      await refetch();
    },
    onSuccess: onClose,
  });

  const disableAction = connected
    ? { onDisable: () => disableSaml.mutateAsync() }
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
  <div className="flex items-center gap-3 text-xs text-gray-11">
    <div
      className={cn(
        'flex items-center gap-2',
        step === 'domain' && 'text-gray-12 font-medium',
      )}
    >
      <span
        className={cn(
          'flex size-5 items-center justify-center rounded-full border text-xs',
          step === 'domain'
            ? 'border-accent-9 bg-accent-9 text-on-accent'
            : 'border-gray-7',
        )}
      >
        1
      </span>
      {t('SSO Domain')}
    </div>
    <div className="h-px w-6 bg-gray-6" />
    <div
      className={cn(
        'flex items-center gap-2',
        step === 'saml' && 'text-gray-12 font-medium',
      )}
    >
      <span
        className={cn(
          'flex size-5 items-center justify-center rounded-full border text-xs',
          step === 'saml'
            ? 'border-accent-9 bg-accent-9 text-on-accent'
            : 'border-gray-7',
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

  const saveDomain = useAdminAction<SsoDomainFormValues>({
    verb: 'save',
    run: async (values) => {
      await samlSsoApi.updateSsoDomain(values.ssoDomain.trim().toLowerCase());
      await refetch();
    },
    feedback: 'inline',
    handleError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: mutationFeedback.message(error),
      });
      setShowUpdateWarning(false);
      return true;
    },
    onSuccess: () => setShowUpdateWarning(false),
  });
  const [notFoundYet, setNotFoundYet] = useState(false);

  const { mutate: verifyDomain, isPending: isVerifying } = useMutation({
    mutationFn: async () => {
      const result = await samlSsoApi.verifySsoDomain();
      await refetch();
      return result;
    },
    onSuccess: (result) => {
      const verified =
        result.ssoDomainVerification?.status ===
        SsoDomainVerificationStatus.VERIFIED;
      setNotFoundYet(!verified);
      if (verified) {
        onVerified();
      }
    },
    onError: (error) => {
      mutationFeedback.error({ error, title: t("Couldn't verify domain") });
    },
  });

  const handleSubmit = (values: SsoDomainFormValues) => {
    form.clearErrors('root.serverError');
    if (platform.ssoDomain) {
      setShowUpdateWarning(true);
      return;
    }
    saveDomain.mutate(values);
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
              <Input {...field} id="ssoDomain" placeholder="acme.com" />
              <FormDescription>
                {t(
                  'When a user enters this domain on the sign-in page, they will be redirected to your SAML identity provider.',
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}

        {verification && !isDirty && (
          <DomainVerificationPanel
            verification={verification}
            isVerifying={isVerifying}
            notFoundYet={notFoundYet}
            onVerify={() => verifyDomain()}
          />
        )}

        <DialogFooter>
          {disableAction && <DisableSamlButton disableAction={disableAction} />}
          {isDirty ? (
            <Button
              {...adminControl(
                platform.ssoDomain
                  ? AdminControl.SSO_SAML_DOMAIN_UPDATE_SUBMIT
                  : AdminControl.SSO_SAML_DOMAIN_SUBMIT,
              )}
              type="submit"
              loading={saveDomain.isPending}
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
      <ConfirmDialog
        open={showUpdateWarning}
        onOpenChange={setShowUpdateWarning}
        title={t('Update SSO domain?')}
        consequence={t(
          "Users won't be able to sign in via SSO until you verify the new domain.",
        )}
        confirmLabel={t('Update domain')}
        destructive={false}
        controlId={AdminControl.SSO_SAML_DOMAIN_UPDATE_CONFIRM}
        onConfirm={() => saveDomain.mutateAsync(form.getValues())}
      />
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

  const { mutate, isPending } = useAdminAction<UpdatePlatformRequestBody>({
    verb: 'save',
    run: async (request) => {
      await platformApi.update(request, platform.id);
      await refetch();
    },
    feedback: 'inline',
    onSuccess: onClose,
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
            form.clearErrors('root.serverError');
            mutate(
              { federatedAuthProviders: { saml: data } },
              {
                onError: (error) =>
                  form.setError('root.serverError', {
                    type: 'manual',
                    message: mutationFeedback.message(error),
                  }),
              },
            );
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
                  className="font-mono text-xs"
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
                <Textarea {...field} required id="idpCertificate" />
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
              <DisableSamlButton
                disableAction={disableAction}
                className="mr-auto"
              />
            )}
            <Button variant="outline" type="button" onClick={onBack}>
              {t('Back')}
            </Button>
            <Button
              {...adminControl(AdminControl.SSO_SAML_CONFIG_SUBMIT)}
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

const DisableSamlButton = ({
  disableAction,
  className,
}: {
  disableAction: NonNullable<DisableAction>;
  className?: string;
}) => (
  <ConfirmDialog
    title={t('Turn off SAML sign-in?')}
    consequence={t(
      "People who sign in through your identity provider can't sign in until SAML is set up again. Make sure you can still sign in another way.",
    )}
    confirmLabel={t('Turn off SAML')}
    controlId={AdminControl.SSO_SAML_DISABLE_RUN}
    onConfirm={disableAction.onDisable}
  >
    <Button
      type="button"
      variant="basic"
      className={cn('text-danger-11', className)}
    >
      {t('Disable')}
    </Button>
  </ConfirmDialog>
);

const DomainVerificationPanel = ({
  verification,
  isVerifying,
  notFoundYet,
  onVerify,
}: {
  verification: SsoDomainVerification;
  isVerifying: boolean;
  notFoundYet: boolean;
  onVerify: () => void;
}) => {
  const verified = verification.status === SsoDomainVerificationStatus.VERIFIED;
  return (
    <div className="flex flex-col gap-3">
      <VerificationStatusBadge status={verification.status} />
      {!verified && (
        <>
          <p className="text-xs text-gray-11">
            {t(
              "Add this TXT record at your DNS provider. We'll detect it once it propagates — this usually takes a few minutes.",
            )}
          </p>
          <VerificationRecordRow record={verification.record} />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              {...adminControl(AdminControl.SSO_SAML_DNS_RUN)}
              type="button"
              size="sm"
              variant="outline"
              loading={isVerifying}
              onClick={onVerify}
            >
              {t('Verify DNS')}
            </Button>
            {notFoundYet && !isVerifying && (
              <span role="status" className="text-xs text-gray-11">
                {t('TXT record not found yet — DNS can take a few minutes.')}
              </span>
            )}
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
      <div className="flex items-center gap-2 text-sm text-success-11">
        <CheckCircle className="size-4" />
        {t('DNS verified — domain is ready')}
      </div>
    );
  }
  return (
    <StatusDot tone="warning" pulse className="text-warning-11">
      {t('Waiting for DNS')}
    </StatusDot>
  );
};

const VerificationRecordRow = ({
  record,
}: {
  record: SsoDomainVerificationRecord;
}) => (
  <div className="flex flex-col gap-2 rounded-md border p-4">
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-gray-3">
        {record.type}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5 min-w-0">
        <Label className="text-xs text-gray-11">{t('Name')}</Label>
        <CopyToClipboardInput
          textToCopy={record.name}
          useInput={true}
          controlId={AdminControl.SSO_SAML_DNS_NAME_COPY}
        />
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        <Label className="text-xs text-gray-11">{t('Value')}</Label>
        <CopyToClipboardInput
          textToCopy={record.value}
          useInput={true}
          controlId={AdminControl.SSO_SAML_DNS_VALUE_COPY}
        />
      </div>
    </div>
  </div>
);

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
  onDisable: () => Promise<unknown>;
} | null;

type ConfigureSamlDialogProps = {
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  refetch: () => Promise<void>;
};
