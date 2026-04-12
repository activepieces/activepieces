import {
  ApFlagId,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Link2, Shield, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { FullLogo } from '@/components/custom/full-logo';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

import { HorizontalSeparatorWithText } from '../../../components/ui/separator';
import { flagsHooks } from '../../../hooks/flags-hooks';

import { SignInForm } from './sign-in-form';
import { SignUpForm } from './sign-up-form';
import { ThirdPartyLogin } from './third-party-logins';

const BottomNote = ({ isSignup }: { isSignup: boolean }) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.toString();

  return isSignup ? (
    <div className="mt-6 text-center text-sm text-muted-foreground">
      {t('Already have an account?')}
      <Link
        to={`/sign-in?${searchQuery}`}
        className="pl-1 font-medium text-foreground hover:underline transition-all duration-200"
      >
        {t('Sign in')}
      </Link>
    </div>
  ) : (
    <div className="mt-6 text-center text-sm text-muted-foreground">
      {t("Don't have an account?")}
      <Link
        to={`/sign-up?${searchQuery}`}
        className="pl-1 font-medium text-foreground hover:underline transition-all duration-200"
      >
        {t('Sign up')}
      </Link>
    </div>
  );
};

const AuthSeparator = ({
  isEmailAuthEnabled,
}: {
  isEmailAuthEnabled: boolean;
}) => {
  const { data: thirdPartyAuthProviders } =
    flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP
    );

  return (thirdPartyAuthProviders?.google || thirdPartyAuthProviders?.saml) &&
    isEmailAuthEnabled ? (
    <HorizontalSeparatorWithText className="my-5">
      {t('OR')}
    </HorizontalSeparatorWithText>
  ) : null;
};

const BRAND_FEATURES = [
  {
    icon: Zap,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'No-code automation',
    desc: 'Build powerful workflows without writing a single line of code.',
  },
  {
    icon: Link2,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: '200+ integrations',
    desc: 'Connect Slack, Notion, HubSpot, and hundreds more apps.',
  },
  {
    icon: Shield,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'Enterprise-ready',
    desc: 'SSO, audit logs, and on-prem deployment for full data control.',
  },
] as const;

const BrandPanel = () => {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 flex-col p-12 relative overflow-hidden"
      style={{ backgroundColor: '#F4F3FC' }}
    >
      <div className="absolute -top-20 -right-16 w-80 h-80 rounded-full bg-violet-400/10 pointer-events-none" />
      <div className="absolute -bottom-10 -left-14 w-60 h-60 rounded-full bg-blue-400/10 pointer-events-none" />
      <div className="absolute top-[42%] right-14 w-28 h-28 rounded-full bg-orange-300/10 pointer-events-none" />
      <div
        className="absolute top-10 left-8 w-52 h-36 opacity-28 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, #7C6EE8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        className="absolute bottom-12 right-7 w-40 h-32 opacity-22 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, #7C6EE8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col h-full gap-8">
        <div>
          <FullLogo />
        </div>

        <div className="flex-1 flex flex-col justify-center gap-5">
          <div className="w-16 h-1 rounded-full bg-violet-600" />
          <h2 className="text-[42px] font-bold text-[#221A45] leading-tight tracking-tight">
            {t('Build faster,')}
            <br />
            {t('automate smarter.')}
          </h2>
          <p className="text-[#5C528E] text-[16px] leading-relaxed max-w-sm">
            {t(
              'Join thousands of teams using Activepieces to connect their apps and automate workflows effortlessly.'
            )}
          </p>

          <div className="flex flex-col gap-3">
            {BRAND_FEATURES.map(
              ({ icon: Icon, iconBg, iconColor, title, desc }) => (
                <div
                  key={title}
                  className="flex items-center gap-4 bg-white/70 border border-[#E0DCF0] rounded-xl px-4 py-3"
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                      iconBg
                    )}
                  >
                    <Icon className={cn('w-4 h-4', iconColor)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#221A45]">
                      {t(title)}
                    </p>
                    <p className="text-xs text-[#6B6299] leading-relaxed mt-0.5">
                      {t(desc)}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthFormTemplate = React.memo(
  ({ form }: { form: 'signin' | 'signup' }) => {
    const isSignUp = form === 'signup';
    const token = authenticationSession.getToken();
    const redirectAfterLogin = useRedirectAfterLogin();
    const [showCheckYourEmailNote, setShowCheckYourEmailNote] = useState(false);
    const { data: isEmailAuthEnabled } = flagsHooks.useFlag<boolean>(
      ApFlagId.EMAIL_AUTH_ENABLED
    );
    const isCloud = window.location.hostname === 'cloud.activepieces.com';
    const data = {
      signin: {
        title: t('Welcome back'),
        description: t('Sign in to your account to continue'),
      },
      signup: {
        title: t("Let's get started"),
        description: t('Create your account and start flowing'),
      },
    }[form];

    useEffect(() => {
      if (token) {
        redirectAfterLogin();
      }
    }, [token, redirectAfterLogin]);

    if (token) {
      return null;
    }

    return (
      <div className="flex h-screen w-full">
        <BrandPanel />

        <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-sm flex flex-col gap-0">
            <div className="mb-8">
              {isCloud ? (
                <Link
                  to="https://activepieces.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FullLogo />
                </Link>
              ) : (
                <FullLogo />
              )}
            </div>

            {!showCheckYourEmailNote && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                  {data.title}
                </h1>
                <p className="text-muted-foreground text-sm mt-1.5">
                  {data.description}
                </p>
              </div>
            )}

            {!showCheckYourEmailNote && <ThirdPartyLogin isSignUp={isSignUp} />}
            <AuthSeparator
              isEmailAuthEnabled={
                (isEmailAuthEnabled ?? true) && !showCheckYourEmailNote
              }
            />

            {isEmailAuthEnabled ? (
              isSignUp ? (
                <SignUpForm
                  setShowCheckYourEmailNote={setShowCheckYourEmailNote}
                  showCheckYourEmailNote={showCheckYourEmailNote}
                />
              ) : (
                <SignInForm />
              )
            ) : null}

            <BottomNote isSignup={isSignUp} />
          </div>
        </div>
      </div>
    );
  }
);

AuthFormTemplate.displayName = 'AuthFormTemplate';

export { AuthFormTemplate };
