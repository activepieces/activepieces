import { ErrorCode, isNil } from '@activepieces/core-utils';
import {
  ApFlagId,
  CreateOtpRequestBody,
  MAX_FULL_NAME_LENGTH,
  OtpType,
  TelemetryEventName,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Lightbulb,
  Mail,
  User,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { authenticationApi } from '@/api/authentication-api';
import { FullLogo } from '@/components/custom/full-logo';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { HorizontalSeparatorWithText } from '@/components/ui/separator';
import { authMutations } from '@/features/authentication/hooks/auth-hooks';
import { captchaUtils } from '@/features/authentication/utils/captcha-utils';
import { flagsHooks } from '@/hooks/flags-hooks';
import { HttpError, api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

import { CheckEmailNote } from '../check-email-note';
import { SamlLoginForm } from '../saml-login-form';
import { SignInForm } from '../sign-in-form';
import { SignUpForm } from '../sign-up-form';
import {
  ThirdPartyLogin,
  useShowThirdPartyProviders,
  useThirdPartyAvailability,
} from '../third-party-logins';

import { TurnstileWidget, useTurnstileSiteKey } from './turnstile-widget';

const CODE_LENGTH = 6;

const RESEND_COOLDOWN_SECONDS = 60;

// Every title in the card shares this: Inter at 400 rather than the Sentient
// display serif — on a signup card a headline should read as a calm, modern
// label, not a statement that slows the eye down. 400 is the lightest weight
// actually loaded; 300 would silently fall back and look identical.
const AUTH_TITLE_CLASS =
  'text-center text-[21px] font-normal leading-snug tracking-[-0.02em] text-balance text-foreground';

// Steps cross-fade instead of snapping, and the card animates to the new
// height, so moving between email → code → password reads as one surface
// changing rather than three separate screens.
export function AuthDrawerBody({ initialMode }: AuthDrawerBodyProps) {
  // All of it lives here, not in AuthStep: the animation keys AuthStep by
  // step, so AuthStep remounts on every transition and would drop the email
  // captured on the way to the code screen.
  // A stored onboarding token means the member verified their email but never
  // gave us a name, so resume there wherever they re-enter the app.
  const [step, setStep] = useState<Step>(
    authenticationSession.isOnboarding() ? 'name' : 'method',
  );
  const [samlOpen, setSamlOpen] = useState(false);
  // An invitation arrives as /sign-up?email=…, which that route forwards here
  // with the search intact. The address is the invitee's, and they have no
  // account yet, so the card opens on sign-up with the field already filled.
  const invitedEmail = useSearchParams()[0].get('email') ?? '';
  const [mode, setMode] = useState<AuthMode>(
    invitedEmail.length > 0 ? 'signup' : initialMode,
  );
  const [emailForCode, setEmailForCode] = useState('');
  const [checkEmailNote, setCheckEmailNote] = useState(false);
  const { capture } = useTelemetry();
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const [captchaReset, setCaptchaReset] = useState(0);
  const [captchaUnavailable, setCaptchaUnavailable] = useState(false);
  const handleCaptchaUnavailable = useCallback(() => {
    setCaptchaUnavailable(true);
    capture({
      name: TelemetryEventName.CAPTCHA_UNAVAILABLE,
      payload: { surface: 'code-request' },
    });
  }, [capture]);
  // A token is single-use, so every request spends the one in hand and the
  // widget has to mint the next. The widget itself lives out here rather than
  // inside a step: asking for a code and resending one are two requests, and a
  // widget that unmounted with the email step would leave the resend with
  // nothing to send.
  const spendCaptcha = useCallback(() => {
    setCaptchaToken(undefined);
    setCaptchaReset((count) => count + 1);
  }, []);
  const captchaRequired = !isNil(useTurnstileSiteKey()) && !captchaUnavailable;
  const passwordlessAvailable = usePasswordlessAvailable();
  const challengeApplies =
    passwordlessAvailable && (step === 'method' || step === 'code');

  return (
    <AutoHeight>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={samlOpen ? 'saml' : step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
        >
          <AuthStep
            step={step}
            setStep={setStep}
            samlOpen={samlOpen}
            setSamlOpen={setSamlOpen}
            mode={mode}
            setMode={setMode}
            emailForCode={emailForCode}
            setEmailForCode={setEmailForCode}
            checkEmailNote={checkEmailNote}
            setCheckEmailNote={setCheckEmailNote}
            invitedEmail={invitedEmail}
            captchaToken={captchaToken}
            captchaRequired={captchaRequired}
            onCaptchaSpent={spendCaptcha}
          />
        </motion.div>
      </AnimatePresence>
      {challengeApplies && (
        <TurnstileWidget
          onToken={setCaptchaToken}
          onUnavailable={handleCaptchaUnavailable}
          resetSignal={captchaReset}
        />
      )}
    </AutoHeight>
  );
}

// Animates the card to each step's height off a measured value. Letting the
// height fall out of the layout instead (or animating to 'auto') collapses the
// card for a frame while the old step unmounts — that is the flicker.
function AutoHeight({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    setHeight(element.offsetHeight);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      animate={{ height }}
      initial={false}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div ref={contentRef}>{children}</div>
    </motion.div>
  );
}

function AuthStep({
  step,
  setStep,
  samlOpen,
  setSamlOpen,
  mode,
  setMode,
  emailForCode,
  setEmailForCode,
  checkEmailNote,
  setCheckEmailNote,
  invitedEmail,
  captchaToken,
  captchaRequired,
  onCaptchaSpent,
}: AuthStepProps) {
  const { data: emailAuthEnabledFlag } = flagsHooks.useFlag<boolean>(
    ApFlagId.EMAIL_AUTH_ENABLED,
  );
  const { data: userCreated } = flagsHooks.useFlag<boolean>(
    ApFlagId.USER_CREATED,
  );
  // Absent, not false: the flag has no row until the first account exists, so a
  // fresh install omits it from /v1/flags entirely. Flags are loaded through a
  // suspense query, so undefined here means missing rather than still loading.
  const firstUser = userCreated !== true;
  const effectiveMode: AuthMode = firstUser ? 'signup' : mode;
  const emailAuthEnabled = emailAuthEnabledFlag ?? true;
  const passwordlessAvailable = usePasswordlessAvailable();
  const showThirdParty = useShowThirdPartyProviders();
  const thirdParty = useThirdPartyAvailability();

  // The confirmation is a beat, not a screen: hold it just long enough to read
  // as "that worked" before the name question replaces it.
  useEffect(() => {
    if (step !== 'verified') {
      return;
    }
    const timer = setTimeout(() => setStep('name'), VERIFIED_HOLD_MS);
    return () => clearTimeout(timer);
  }, [step, setStep]);

  const abandonOnboarding = useCallback(() => {
    authenticationSession.clearSession();
    setStep('method');
  }, [setStep]);

  if (samlOpen) {
    return (
      <DrawerShell>
        <BackLink onClick={() => setSamlOpen(false)} />
        <Heading title={t('Single sign-on')} />
        <SamlLoginForm
          onBack={() => setSamlOpen(false)}
          showBackButton={false}
        />
      </DrawerShell>
    );
  }

  if (step === 'verified') {
    return (
      <DrawerShell>
        <VerifiedFlash />
      </DrawerShell>
    );
  }

  if (step === 'name') {
    return (
      <DrawerShell>
        <Heading
          title={t('What should we call you?')}
          subtitle={t('This names your workspace and how we greet you.')}
        />
        <NameStep onSessionRejected={abandonOnboarding} />
      </DrawerShell>
    );
  }

  // No email/password auth at all — third-party only.
  if (!emailAuthEnabled) {
    return (
      <DrawerShell>
        <Heading title={t('Welcome')} />
        <ThirdPartyLogin
          isSignUp={mode === 'signup'}
          onSamlClick={() => setSamlOpen(true)}
        />
      </DrawerShell>
    );
  }

  // No email delivery configured (e.g. bare self-hosted): passwords stay the
  // primary path, with the classic sign-in / sign-up forms.
  if (!passwordlessAvailable) {
    return (
      <DrawerShell>
        <Heading
          title={
            effectiveMode === 'signup'
              ? t('Create your account')
              : t('Welcome back')
          }
        />
        {showThirdParty && (
          <>
            <ThirdPartyLogin
              isSignUp={effectiveMode === 'signup'}
              onSamlClick={() => setSamlOpen(true)}
            />
            <HorizontalSeparatorWithText className="my-5 text-muted-foreground">
              {t('or')}
            </HorizontalSeparatorWithText>
          </>
        )}
        {effectiveMode === 'signup' ? (
          <SignUpForm
            showCheckYourEmailNote={checkEmailNote}
            setShowCheckYourEmailNote={setCheckEmailNote}
          />
        ) : (
          <SignInForm />
        )}
        {!firstUser && <ModeSwitch mode={mode} onSwitch={setMode} />}
      </DrawerShell>
    );
  }

  if (step === 'password') {
    return (
      <DrawerShell>
        <BackLink onClick={() => setStep('method')} />
        <Heading
          title={
            effectiveMode === 'signup'
              ? t('Create your account')
              : t('Sign in with password')
          }
        />
        {effectiveMode === 'signup' ? (
          <SignUpForm
            showCheckYourEmailNote={checkEmailNote}
            setShowCheckYourEmailNote={setCheckEmailNote}
          />
        ) : (
          <SignInForm onForgotPassword={() => setStep('reset')} />
        )}
      </DrawerShell>
    );
  }

  // Resetting stays inside the card — leaving for /forget-password would drop
  // the whole landing experience for one form. The shared ResetPasswordForm is
  // a standalone page card (own chrome, own width, navigates away), so this
  // step drives the same endpoint in the card's own language.
  if (step === 'reset') {
    return (
      <DrawerShell>
        <BackLink onClick={() => setStep('password')} />
        <ResetStep />
      </DrawerShell>
    );
  }

  if (step === 'code') {
    return (
      <DrawerShell>
        <CodeStep
          captchaToken={captchaToken}
          captchaRequired={captchaRequired}
          onCaptchaSpent={onCaptchaSpent}
          email={emailForCode}
          onBack={() => setStep('method')}
          onNeedsName={() => setStep('verified')}
        />
      </DrawerShell>
    );
  }

  return (
    <DrawerShell>
      <h1 className={cn(AUTH_TITLE_CLASS, 'mb-6')}>
        {t('Dream big. Automate the rest.')}
      </h1>
      {/* Google leads: it is one tap against typing an address and waiting for
          a code. SAML is enterprise plumbing — it lives with the quiet links
          below so it never competes with the primary path. */}
      {thirdParty.google && (
        <>
          <ThirdPartyLogin
            isSignUp={mode === 'signup'}
            onSamlClick={() => setSamlOpen(true)}
            hideSaml
          />
          <HorizontalSeparatorWithText className="my-4 text-muted-foreground">
            {t('or')}
          </HorizontalSeparatorWithText>
        </>
      )}
      <EmailStep
        invitedEmail={invitedEmail}
        captchaToken={captchaToken}
        captchaRequired={captchaRequired}
        onCaptchaSpent={onCaptchaSpent}
        onCodeSent={(email) => {
          setEmailForCode(email);
          setStep('code');
        }}
      />
      <div className="mt-5 flex items-center justify-center gap-2.5 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => setStep('password')}
          data-testid="auth-use-password"
          className="transition-colors hover:text-foreground"
        >
          {t('Use password')}
        </button>
        {thirdParty.saml && (
          <>
            <span aria-hidden className="text-border">
              •
            </span>
            <button
              type="button"
              onClick={() => {
                if (thirdParty.samlIsCloud) {
                  setSamlOpen(true);
                  return;
                }
                window.location.href = '/api/v1/authn/saml/login';
              }}
              className="transition-colors hover:text-foreground"
            >
              {t('Use SSO')}
            </button>
          </>
        )}
      </div>
      <LegalNote />
    </DrawerShell>
  );
}

function LegalNote() {
  const { data: termsUrl } = flagsHooks.useFlag<string>(
    ApFlagId.TERMS_OF_SERVICE_URL,
  );
  const { data: privacyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.PRIVACY_POLICY_URL,
  );

  if (isNil(termsUrl) && isNil(privacyUrl)) {
    return null;
  }

  return (
    <p className="mt-8 border-t pt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
      {t('By continuing, you agree to our')}{' '}
      {!isNil(termsUrl) && (
        <a
          href={termsUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {t('Terms of Service')}
        </a>
      )}
      {!isNil(termsUrl) && !isNil(privacyUrl) && ` ${t('and')} `}
      {!isNil(privacyUrl) && (
        <a
          href={privacyUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {t('Privacy Policy')}
        </a>
      )}
    </p>
  );
}

// A gentle nudge, never a blocker: personal addresses still work. It sits
// inside the field's own container, under a hairline. A lightbulb, not an
// alert — anything that reads as an error here costs signups.
function WorkEmailHint() {
  return (
    <div className="flex items-center gap-2 border-t border-primary/20 px-4 py-2.5 text-xs text-primary animate-in fade-in duration-200">
      <Lightbulb className="size-3.5 shrink-0" />
      <p>{t('Use your work email for better personalization.')}</p>
    </div>
  );
}

function EmailStep({
  invitedEmail,
  captchaToken,
  captchaRequired,
  onCaptchaSpent,
  onCodeSent,
}: EmailStepProps) {
  const form = useForm<EmailSchema>({
    resolver: zodResolver(EmailZodSchema),
    defaultValues: { email: invitedEmail },
    // Never call an address invalid before the user has actually tried to
    // continue — not while typing, not on blur. After a failed submit it
    // corrects live as they fix it.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // Only nudge once the address is actually complete, so the hint doesn't
  // flicker while someone is still typing their domain.
  const email = form.watch('email');
  const emailError = !!form.formState.errors.email;
  const showWorkEmailHint =
    formatUtils.emailRegex.test(email.trim()) && isPersonalEmail(email);

  const { mutate, isPending } = authMutations.useRequestEmailCode({
    onSuccess: () => {
      onCaptchaSpent();
      onCodeSent(form.getValues().email.trim());
    },
    onError: (error) => {
      onCaptchaSpent();
      form.setError('root.serverError', {
        message: requestErrorMessage(error),
      });
    },
  });

  const onSubmit: SubmitHandler<EmailSchema> = (data) => {
    form.clearErrors('root.serverError');
    mutate({ email: data.email.trim(), captchaToken });
  };

  return (
    <Form {...form}>
      <form className="grid space-y-2" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="grid space-y-2">
              {/* One field, one affordance: the submit arrow lives inside the
                  input. When the address is personal the container grows a
                  note beneath the field — the field and the nudge read as one
                  object rather than a warning bolted underneath. */}
              <div
                className={cn(
                  'rounded-xl border bg-background transition-colors duration-200',
                  showWorkEmailHint && 'border-primary/25 bg-primary/[0.03]',
                  emailError && 'border-destructive/40 bg-destructive/[0.03]',
                )}
              >
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    autoFocus
                    type="text"
                    placeholder={t('name@work.com')}
                    className="h-12 border-0 bg-transparent pl-11 pr-14 text-[15px] shadow-none focus-visible:ring-0"
                    data-testid="auth-email"
                  />
                  <Button
                    type="submit"
                    loading={isPending}
                    disabled={captchaRequired && isNil(captchaToken)}
                    aria-label={t('Continue')}
                    data-testid="auth-continue"
                    className="absolute right-1.5 top-1/2 size-9 -translate-y-1/2 rounded-md p-0"
                  >
                    {!isPending && <ArrowRight className="size-4" />}
                  </Button>
                </div>
                {emailError ? (
                  <div className="flex items-center gap-2 border-t border-destructive/25 px-4 py-2.5 text-xs text-destructive animate-in fade-in duration-200">
                    <CircleAlert className="size-3.5 shrink-0" />
                    <p>{t('That doesn’t look like an email address yet.')}</p>
                  </div>
                ) : (
                  showWorkEmailHint && <WorkEmailHint />
                )}
              </div>
            </FormItem>
          )}
        />
        {form?.formState?.errors?.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}
      </form>
    </Form>
  );
}

function ResetStep() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<EmailSchema>({
    resolver: zodResolver(EmailZodSchema),
    defaultValues: { email: '' },
    mode: 'onChange',
  });

  const { mutate, isPending } = useMutation<
    void,
    HttpError,
    CreateOtpRequestBody
  >({
    mutationFn: authenticationApi.sendOtpEmail,
    onSuccess: () => setSentTo(form.getValues().email.trim().toLowerCase()),
  });

  if (sentTo) {
    return (
      <>
        <Heading title={t('Check your inbox')} />
        <CheckEmailNote email={sentTo} type={OtpType.PASSWORD_RESET} />
      </>
    );
  }

  return (
    <>
      <Heading
        title={t('Reset your password')}
        subtitle={t(
          "If the account exists we'll email you a link to set a new password.",
        )}
      />
      <Form {...form}>
        <form
          className="grid space-y-3"
          onSubmit={form.handleSubmit((data) =>
            mutate({
              email: data.email.trim().toLowerCase(),
              type: OtpType.PASSWORD_RESET,
            }),
          )}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    autoFocus
                    type="text"
                    placeholder={t('name@work.com')}
                    className="h-12 rounded-lg pl-11 text-[15px]"
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" loading={isPending} className="h-11 rounded-lg">
            {t('Send reset link')}
          </Button>
        </form>
      </Form>
    </>
  );
}

function VerifiedFlash() {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        className="flex size-16 items-center justify-center rounded-full bg-primary/10"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-8 text-primary"
          aria-hidden
        >
          <motion.path
            d="M20 6 9 17l-5-5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.14, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.2 }}
        className="text-sm text-muted-foreground"
      >
        {t('Email verified')}
      </motion.p>
    </div>
  );
}

function NameStep({ onSessionRejected }: NameStepProps) {
  const redirectAfterLogin = useRedirectAfterLogin();
  const form = useForm<FullNameSchema>({
    resolver: zodResolver(FullNameZodSchema),
    defaultValues: { fullName: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const { mutate, isPending } = authMutations.useCompleteSignUp({
    onSuccess: (data) => {
      authenticationSession.saveResponse(data, false);
      redirectAfterLogin();
    },
    onError: (error) => {
      if (
        api.isError(error) &&
        error.response?.status === HttpStatusCode.Unauthorized
      ) {
        onSessionRejected();
        return;
      }
      form.setError('root.serverError', {
        message: t('Something went wrong, please try again later'),
      });
    },
  });

  const onSubmit: SubmitHandler<FullNameSchema> = (data) => {
    form.clearErrors('root.serverError');
    mutate({ fullName: data.fullName.trim() });
  };

  return (
    <Form {...form}>
      <form className="grid space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="grid space-y-2">
              <div
                className={cn(
                  'rounded-xl border bg-background transition-colors duration-200',
                  form.formState.errors.fullName &&
                    'border-destructive/40 bg-destructive/[0.03]',
                )}
              >
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    autoFocus
                    type="text"
                    autoComplete="name"
                    placeholder={t('Full Name')}
                    className="h-12 border-0 bg-transparent pl-11 pr-4 text-[15px] shadow-none focus-visible:ring-0"
                    data-testid="auth-full-name"
                  />
                </div>
                {form.formState.errors.fullName && (
                  <div className="flex items-center gap-2 border-t border-destructive/25 px-4 py-2.5 text-xs text-destructive animate-in fade-in duration-200">
                    <CircleAlert className="size-3.5 shrink-0" />
                    <p>{t('Tell us your name so we know what to call you.')}</p>
                  </div>
                )}
              </div>
            </FormItem>
          )}
        />
        {form?.formState?.errors?.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}
        <Button
          type="submit"
          loading={isPending}
          className="h-11 w-full rounded-lg"
          data-testid="auth-name-continue"
        >
          {t('Continue')}
        </Button>
      </form>
    </Form>
  );
}

function CodeStep({
  captchaToken,
  captchaRequired,
  onCaptchaSpent,
  email,
  onBack,
  onNeedsName,
}: CodeStepProps) {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const redirectAfterLogin = useRedirectAfterLogin();
  const { capture } = useTelemetry();

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const { mutate: verify, isPending: isVerifying } =
    authMutations.useVerifyEmailCode({
      onSuccess: (data) => {
        authenticationSession.saveResponse(data, false);
        // A brand-new member arrives on the pre-platform onboarding token, so
        // there is no project yet: ask their name before building the platform.
        if (isNil(data.projectId)) {
          onNeedsName();
          return;
        }
        redirectAfterLogin();
      },
      onError: (error) => {
        setCode('');
        setErrorMessage(codeErrorMessage(error));
        capture({
          name: TelemetryEventName.EMAIL_CODE_REJECTED,
          payload: { errorCode: serverErrorCode(error) ?? 'UNKNOWN' },
        });
      },
    });

  const { mutate: resend, isPending: isResending } =
    authMutations.useRequestEmailCode({
      onSuccess: () => {
        onCaptchaSpent();
        setCooldown(RESEND_COOLDOWN_SECONDS);
        capture({
          name: TelemetryEventName.EMAIL_CODE_RESEND_REQUESTED,
          payload: {},
        });
      },
      onError: (error) => {
        onCaptchaSpent();
        setErrorMessage(requestErrorMessage(error));
      },
    });

  const handleChange = (value: string) => {
    setErrorMessage(null);
    setCode(value);
    if (value.length === CODE_LENGTH) {
      verify({ email, code: value });
    }
  };

  return (
    <>
      <BackLink onClick={onBack} />
      <Heading
        title={t('Enter your code')}
        subtitle={t('We sent a 6-digit code to {email}', { email })}
      />
      <div className="flex flex-col items-center gap-4">
        <InputOTP
          maxLength={CODE_LENGTH}
          value={code}
          onChange={handleChange}
          disabled={isVerifying}
          autoFocus
          data-testid="auth-code"
        >
          <InputOTPGroup>
            {Array.from({ length: CODE_LENGTH }).map((_, index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
        <button
          type="button"
          disabled={
            cooldown > 0 ||
            isResending ||
            (captchaRequired && isNil(captchaToken))
          }
          onClick={() => resend({ email, captchaToken })}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {cooldown > 0
            ? t('Resend code in {seconds}s', { seconds: cooldown })
            : t('Resend code')}
        </button>
      </div>
    </>
  );
}

function DrawerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col px-8 pb-7 pt-9">
      <div className="mb-5 flex justify-center">
        <FullLogo className="h-7" />
      </div>
      {children}
    </div>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 text-center">
      <h1 className={AUTH_TITLE_CLASS}>{title}</h1>
      {subtitle && (
        <p className="mx-auto mt-1.5 max-w-[19rem] text-balance text-sm font-medium text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto mb-4 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" />
      {t('Back')}
    </button>
  );
}

function ModeSwitch({
  mode,
  onSwitch,
}: {
  mode: AuthMode;
  onSwitch: (mode: AuthMode) => void;
}) {
  return (
    <div className="mt-6 text-center text-sm text-muted-foreground">
      {mode === 'signup'
        ? t('Already have an account?')
        : t("Don't have an account?")}
      <button
        type="button"
        onClick={() => onSwitch(mode === 'signup' ? 'signin' : 'signup')}
        data-testid="auth-switch-mode"
        className="pl-1 font-medium text-foreground hover:underline"
      >
        {mode === 'signup' ? t('Sign in') : t('Sign up')}
      </button>
    </div>
  );
}

function usePasswordlessAvailable(): boolean {
  const { data: emailAuthEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.EMAIL_AUTH_ENABLED,
  );
  const { data: smtpConfigured } = flagsHooks.useFlag<boolean>(
    ApFlagId.SMTP_CONFIGURED,
  );
  return (emailAuthEnabled ?? true) && !!smtpConfigured;
}

// Country variants are endless (yahoo.co.uk, hotmail.fr, …), so match the
// provider by prefix and keep the exact list for the one-off domains.
function isPersonalEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) {
    return false;
  }
  return (
    PERSONAL_EMAIL_DOMAINS.has(domain) ||
    PERSONAL_EMAIL_PREFIXES.some((prefix) => domain.startsWith(prefix))
  );
}

function requestErrorMessage(error: HttpError): string {
  if (api.isError(error)) {
    const errorCode = (error.response?.data as { code?: ErrorCode })?.code;
    if (errorCode === ErrorCode.INVITATION_ONLY_SIGN_UP) {
      return t('You need an invitation to sign up.');
    }
    if (errorCode === ErrorCode.DOMAIN_NOT_ALLOWED) {
      return t('Email domain is disallowed');
    }
    if (errorCode === ErrorCode.EMAIL_AUTH_DISABLED) {
      return t('Email sign-in is disabled');
    }
    if (captchaUtils.isRejection(error)) {
      return t('That verification expired. Please try again.');
    }
  }
  return t('Something went wrong, please try again later');
}

function serverErrorCode(error: HttpError): string | undefined {
  return (error.response?.data as { code?: string })?.code;
}

function codeErrorMessage(error: HttpError): string {
  if (api.isError(error)) {
    const errorCode = (error.response?.data as { code?: ErrorCode })?.code;
    if (errorCode === ErrorCode.INVALID_OTP) {
      return t('That code is invalid or expired. Try again.');
    }
    if (errorCode === ErrorCode.DOMAIN_NOT_ALLOWED) {
      return t('Email domain is disallowed');
    }
    if (errorCode === ErrorCode.INVITATION_ONLY_SIGN_UP) {
      return t('You need an invitation to sign up.');
    }
  }
  return t('Something went wrong, please try again later');
}

const VERIFIED_HOLD_MS = 1100;

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'msn.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'qq.com',
  '163.com',
  '126.com',
  'naver.com',
  'web.de',
  'orange.fr',
  'free.fr',
]);

const PERSONAL_EMAIL_PREFIXES = [
  'yahoo.',
  'hotmail.',
  'outlook.',
  'live.',
  'gmx.',
];

const EmailZodSchema = z.object({
  email: z.string().trim().regex(formatUtils.emailRegex, 'Email is invalid'),
});

type EmailSchema = z.infer<typeof EmailZodSchema>;

const FullNameZodSchema = z.object({
  fullName: z.string().trim().min(1).max(MAX_FULL_NAME_LENGTH),
});

type FullNameSchema = z.infer<typeof FullNameZodSchema>;

type CodeStepProps = {
  captchaToken: string | undefined;
  captchaRequired: boolean;
  onCaptchaSpent: () => void;
  email: string;
  onBack: () => void;
  onNeedsName: () => void;
};

type EmailStepProps = {
  invitedEmail: string;
  captchaToken: string | undefined;
  captchaRequired: boolean;
  onCaptchaSpent: () => void;
  onCodeSent: (email: string) => void;
};

type NameStepProps = {
  onSessionRejected: () => void;
};

type AuthDrawerBodyProps = {
  initialMode: AuthMode;
};

type AuthStepProps = {
  step: Step;
  setStep: Dispatch<SetStateAction<Step>>;
  samlOpen: boolean;
  setSamlOpen: Dispatch<SetStateAction<boolean>>;
  mode: AuthMode;
  setMode: Dispatch<SetStateAction<AuthMode>>;
  emailForCode: string;
  setEmailForCode: Dispatch<SetStateAction<string>>;
  checkEmailNote: boolean;
  setCheckEmailNote: Dispatch<SetStateAction<boolean>>;
  invitedEmail: string;
  captchaToken: string | undefined;
  captchaRequired: boolean;
  onCaptchaSpent: () => void;
};

type Step = 'method' | 'code' | 'verified' | 'name' | 'password' | 'reset';

export type AuthMode = 'signin' | 'signup';
