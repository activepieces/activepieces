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
import { ExternalLink, TriangleAlert } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { StatusDot } from '@/components/custom/status-dot';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  children,
}: ConfigureSamlDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="lg">
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
        <DialogTitle>
          {connected ? t('Edit SAML 2.0') : t('Set up SAML 2.0')}
        </DialogTitle>
        <DialogDescription>
          {t('Connect the identity provider your company already uses.')}
        </DialogDescription>
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
  <div className="flex items-center gap-2">
    <Badge variant={step === 'domain' ? 'info' : 'outline'}>
      {t('1 · Domain')}
    </Badge>
    <div className="h-px w-6 bg-gray-6" />
    <Badge variant={step === 'saml' ? 'info' : 'outline'}>
      {t('2 · Identity provider')}
    </Badge>
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
        message: api.extractServerErrorMessage(
          error,
          t("Couldn't save domain"),
        ),
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
        api.extractServerErrorMessage(error, t("Couldn't verify domain")),
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
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          name="ssoDomain"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="ssoDomain">{t('SSO domain')}</Label>
              <Input {...field} id="ssoDomain" placeholder="acme.com" />
              <FormDescription>
                {t(
                  'People with an email address on this domain are sent to your identity provider to sign in. Ownership is verified with a DNS record first.',
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
              variant="ghost"
              className="mr-auto text-danger-11"
              loading={disableAction.isDisabling}
              onClick={disableAction.onDisable}
            >
              {t('Disable SAML')}
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
              {t('Continue')}
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
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-12">
            {t('Give these to your identity provider')}
          </span>
          <Button variant="link" size="sm" asChild>
            <a
              href="https://www.activepieces.com/docs/security/sso"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Read the docs')}
              <ExternalLink />
            </a>
          </Button>
        </div>
        {samlAcs && (
          <div className="flex min-w-0 flex-col gap-2">
            <Label>{t('Single sign-on URL')}</Label>
            <CopyToClipboardInput textToCopy={samlAcs} useInput={true} />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-2">
          <Label>{t('Audience URI (SP entity ID)')}</Label>
          <CopyToClipboardInput textToCopy="Activepieces" useInput={true} />
        </div>
      </div>

      <Form {...form}>
        <form
          className="flex flex-col gap-4 pt-4"
          onSubmit={form.handleSubmit((data) => {
            mutate({ federatedAuthProviders: { saml: data } });
          })}
        >
          <FormField
            name="idpMetadata"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="idpMetadata">
                  {t('Identity provider metadata')}
                </Label>
                <Textarea
                  {...field}
                  id="idpMetadata"
                  rows={4}
                  className="font-mono"
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
              <FormItem>
                <Label htmlFor="idpCertificate">
                  {t('Signing certificate')}
                </Label>
                <Textarea
                  {...field}
                  id="idpCertificate"
                  rows={4}
                  placeholder="-----BEGIN CERTIFICATE-----"
                  className="font-mono"
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
                variant="ghost"
                className="mr-auto text-danger-11"
                loading={disableAction.isDisabling}
                onClick={disableAction.onDisable}
              >
                {t('Disable SAML')}
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
      <VerificationStatus status={verification.status} />
      {!verified && (
        <>
          <p className="text-sm text-gray-11">
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

const VerificationStatus = ({
  status,
}: {
  status: SsoDomainVerificationStatus;
}) =>
  status === SsoDomainVerificationStatus.VERIFIED ? (
    <StatusDot tone="success">{t('Verified')}</StatusDot>
  ) : (
    <StatusDot tone="warning" pulse>
      {t('Waiting for DNS')}
    </StatusDot>
  );

const VerificationRecordRow = ({
  record,
}: {
  record: SsoDomainVerificationRecord;
}) => (
  <div className="flex flex-col gap-3 rounded-xl border border-gray-6 p-3">
    <Badge variant="secondary" className="font-mono">
      {record.type}
    </Badge>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex min-w-0 flex-col gap-2">
        <Label>{t('Name')}</Label>
        <CopyToClipboardInput textToCopy={record.name} useInput={true} />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <Label>{t('Value')}</Label>
        <CopyToClipboardInput textToCopy={record.value} useInput={true} />
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
  onDisable: () => void;
  isDisabling: boolean;
} | null;

type ConfigureSamlDialogProps = {
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  refetch: () => Promise<void>;
  children: React.ReactNode;
};
