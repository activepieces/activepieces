import {
  ApFlagId,
  formErrors,
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import {
  AdminPage,
  AdminPageHeader,
  SettingsPanel,
  SettingsRow,
  adminPageResources,
} from '@/app/components/admin';
import { DomainVerification } from '@/app/routes/platform/security/sso/domain-verification';
import { MethodConfirmDialog } from '@/app/routes/platform/security/sso/method-confirm-dialog';
import { ssoPaths } from '@/app/routes/platform/security/sso/sso-paths';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

export const SamlSetupPage = () => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const navigate = useNavigate();
  const connected = !!platform.federatedAuthProviders?.saml;
  const domainVerified =
    platform.ssoDomainVerification?.status ===
    SsoDomainVerificationStatus.VERIFIED;
  const [step, setStep] = useState<WizardStep>(
    connected || !domainVerified ? 'domain' : 'saml',
  );

  return (
    <AdminPage width="content">
      <AdminPageHeader
        title={t('Single sign-on')}
        description={t('Connect a SAML 2.0 identity provider.')}
        back={{ label: t('Authentication'), to: ssoPaths.authentication }}
        resources={adminPageResources.sso}
      />
      <SettingsPanel>
        <SamlWizard
          platform={platform}
          connected={connected}
          domainVerified={domainVerified}
          step={step}
          onStepChange={setStep}
          refetch={refetch}
          onClose={() => navigate(ssoPaths.authentication)}
        />
      </SettingsPanel>
      {connected && step === 'saml' && (
        <DisableSamlRow
          platform={platform}
          refetch={refetch}
          onDisabled={() => navigate(ssoPaths.authentication)}
        />
      )}
    </AdminPage>
  );
};

const DisableSamlRow = ({
  platform,
  refetch,
  onDisabled,
}: {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  onDisabled: () => void;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: disableSaml, isPending } = useMutation({
    mutationFn: async () => {
      await platformApi.update(
        { federatedAuthProviders: { saml: null } },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Single sign-on settings updated'), { duration: 3000 });
      onDisabled();
    },
  });

  return (
    <SettingsPanel flush>
      <SettingsRow
        title={t('Disable single sign-on')}
        description={t(
          'Deletes the SAML connection. Your verified domain stays, so you can connect again later.',
        )}
      >
        <Button
          {...adminControl(AdminControl.SSO_SAML_DISABLE_RUN)}
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
        >
          {t('Disable')}
        </Button>
      </SettingsRow>
      <MethodConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('Disable single sign-on?')}
        description={
          <span className="flex flex-col gap-2">
            <span>
              {t(
                'Your SAML connection will be deleted, so people who use single sign-on will have to sign in another way.',
              )}
            </span>
            {!platform.emailAuthEnabled && (
              <span>
                {t('Email sign-in is off. Turn it on first if they need it.')}
              </span>
            )}
          </span>
        }
        confirmLabel={t('Disable')}
        destructive
        isPending={isPending}
        controlId={AdminControl.SSO_SAML_DISABLE_CONFIRM}
        onConfirm={() => disableSaml()}
      />
    </SettingsPanel>
  );
};

const SamlWizard = ({
  platform,
  connected,
  domainVerified,
  step,
  onStepChange: setStep,
  refetch,
  onClose,
}: {
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  domainVerified: boolean;
  step: WizardStep;
  onStepChange: (step: WizardStep) => void;
  refetch: () => Promise<void>;
  onClose: () => void;
}) => {
  const samlUnlocked = domainVerified || connected;
  return (
    <>
      <StepIndicator
        step={step}
        samlLocked={!samlUnlocked}
        onSelect={setStep}
      />
      <div className={cn(step !== 'domain' && 'hidden')}>
        <DomainStep
          platform={platform}
          refetch={refetch}
          canContinue={samlUnlocked}
          onVerified={() => setStep('saml')}
          onNext={() => setStep('saml')}
        />
      </div>
      <div className={cn(step !== 'saml' && 'hidden')}>
        <SamlStep
          platform={platform}
          connected={connected}
          domainVerified={domainVerified}
          refetch={refetch}
          onBack={() => setStep('domain')}
          onClose={onClose}
        />
      </div>
    </>
  );
};

const StepIndicator = ({
  step,
  samlLocked,
  onSelect,
}: {
  step: WizardStep;
  samlLocked: boolean;
  onSelect: (step: WizardStep) => void;
}) => (
  <div className="flex items-center gap-3 text-xs text-gray-11">
    <StepButton
      number={1}
      label={t('SSO Domain')}
      active={step === 'domain'}
      onClick={() => onSelect('domain')}
    />
    <div className="h-px w-6 bg-gray-6" />
    <StepButton
      number={2}
      label={t('SAML 2.0')}
      active={step === 'saml'}
      disabled={samlLocked}
      onClick={() => onSelect('saml')}
    />
  </div>
);

const StepButton = ({
  number,
  label,
  active,
  disabled = false,
  onClick,
}: {
  number: number;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-current={active ? 'step' : undefined}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 rounded-md hover:text-gray-12 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50 disabled:pointer-events-none disabled:opacity-50',
      active && 'font-medium text-gray-12',
    )}
  >
    <span
      className={cn(
        'flex size-5 items-center justify-center rounded-full border text-xs',
        active ? 'border-accent-9 bg-accent-9 text-on-accent' : 'border-gray-7',
      )}
    >
      {number}
    </span>
    {label}
  </button>
);

const DomainStep = ({
  platform,
  refetch,
  canContinue,
  onVerified,
  onNext,
}: {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  canContinue: boolean;
  onVerified: () => void;
  onNext: () => void;
}) => {
  const verified =
    !!platform.ssoDomain &&
    platform.ssoDomainVerification?.status ===
      SsoDomainVerificationStatus.VERIFIED;

  return (
    <DomainVerification
      platform={platform}
      refetch={refetch}
      onVerified={onVerified}
      nextAction={
        <Button
          type="button"
          variant={verified ? 'default' : 'outline'}
          disabled={!canContinue}
          onClick={onNext}
        >
          {t('Next')}
        </Button>
      }
    />
  );
};

const SamlStep = ({
  platform,
  connected,
  domainVerified,
  refetch,
  onBack,
  onClose,
}: {
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  domainVerified: boolean;
  refetch: () => Promise<void>;
  onBack: () => void;
  onClose: () => void;
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
    <div className="flex flex-col gap-6">
      {samlAcs && (
        <StepSection title={t('Copy these into your identity provider')}>
          <div className="flex min-w-0 flex-col gap-2">
            <Label>{t('Single sign-on URL')}</Label>
            <CopyToClipboardInput
              textToCopy={samlAcs}
              useInput={true}
              controlId={AdminControl.SSO_SAML_ACS_URL_COPY}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label>{t('Audience URI (SP Entity ID)')}</Label>
            <CopyToClipboardInput
              textToCopy={SAML_ENTITY_ID}
              useInput={true}
              controlId={AdminControl.SSO_SAML_ENTITY_ID_COPY}
            />
          </div>
        </StepSection>
      )}

      <Form {...form}>
        <form
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit((data) => {
            mutate({ federatedAuthProviders: { saml: data } });
          })}
        >
          <StepSection
            title={t('Paste these from your identity provider')}
            divided={!!samlAcs}
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
                    placeholder={
                      connected
                        ? t('Saved. Paste new metadata to replace it.')
                        : undefined
                    }
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
                    placeholder={
                      connected
                        ? t('Saved. Paste a new certificate to replace it.')
                        : undefined
                    }
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </StepSection>
          {!domainVerified && (
            <Alert variant="warning">
              <TriangleAlert className="size-4" />
              <AlertDescription>
                {t(
                  'Verify your domain before saving. You can already copy the values above into your identity provider.',
                )}
              </AlertDescription>
            </Alert>
          )}
          {form?.formState?.errors?.root?.serverError && (
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
          )}

          <StepFooter>
            <Button variant="outline" type="button" onClick={onBack}>
              {t('Back')}
            </Button>
            <Button
              {...adminControl(AdminControl.SSO_SAML_CONFIG_SUBMIT)}
              loading={isPending}
              disabled={!domainVerified || !form.formState.isValid}
              type="submit"
            >
              {t('Save')}
            </Button>
          </StepFooter>
        </form>
      </Form>
    </div>
  );
};

const StepSection = ({
  title,
  divided = false,
  children,
}: {
  title: string;
  divided?: boolean;
  children: ReactNode;
}) => (
  <section className={cn('flex flex-col gap-4', divided && 'border-t pt-6')}>
    <h3 className="text-sm font-semibold text-gray-12">{title}</h3>
    {children}
  </section>
);

const StepFooter = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    {children}
  </div>
);

const SAML_ENTITY_ID = 'Activepieces';

const Saml2FormValues = z.object({
  idpMetadata: z.string().min(1, formErrors.required),
  idpCertificate: z.string().min(1, formErrors.required),
});
type Saml2FormValues = z.infer<typeof Saml2FormValues>;

type WizardStep = 'domain' | 'saml';
