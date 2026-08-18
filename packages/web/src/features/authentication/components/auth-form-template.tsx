import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';

import { FullLogo } from '../../../components/custom/full-logo';
import { flagsHooks } from '../../../hooks/flags-hooks';

import { AuthAnimation } from './auth-animation';

const TermsFooter = () => {
  const { data: termsOfServiceUrl } = flagsHooks.useFlag<string>(
    ApFlagId.TERMS_OF_SERVICE_URL,
  );
  const { data: privacyPolicyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.PRIVACY_POLICY_URL,
  );
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (
    edition !== ApEdition.CLOUD ||
    (!termsOfServiceUrl && !privacyPolicyUrl)
  ) {
    return null;
  }

  return (
    <div className="text-center text-xs text-muted-foreground">
      {t('By continuing, you agree to our')}
      {termsOfServiceUrl && (
        <Link
          to={termsOfServiceUrl}
          target="_blank"
          className="px-1 text-muted-foreground underline hover:text-primary text-xs transition-all duration-200"
        >
          {t('Terms of Service')}
        </Link>
      )}
      {termsOfServiceUrl && privacyPolicyUrl && t('and')}
      {privacyPolicyUrl && (
        <Link
          to={privacyPolicyUrl}
          target="_blank"
          className="pl-1 text-muted-foreground underline hover:text-primary text-xs transition-all duration-200"
        >
          {t('Privacy Policy')}
        </Link>
      )}
      .
    </div>
  );
};

const AuthImage = () => {
  const [loaded, setLoaded] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);

  return (
    <img
      src="https://cdn.activepieces.com/assets/auth-bg.webp"
      alt=""
      onLoad={onLoad}
      className={cn(
        'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
        loaded ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
};

const AuthLayout = ({
  children,
  isSignUp,
}: {
  children: React.ReactNode;
  isSignUp?: boolean;
}) => {
  const { setForceLightMode } = useTheme();
  useEffect(() => {
    setForceLightMode(true);
    return () => setForceLightMode(false);
  }, [setForceLightMode]);
  return (
    <div className="h-screen w-full overflow-hidden flex bg-white relative">
      {/* Form — left side */}
      <div className="flex flex-col w-full lg:w-1/2 p-5 lg:px-[100px]">
        <div className="pt-3 flex justify-center">
          <FullLogo />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-xs overflow-y-auto px-1">{children}</div>
        </div>
        {isSignUp && (
          <div className="pb-4">
            <TermsFooter />
          </div>
        )}
      </div>

      {/* Right side — animation for sign-up, image for sign-in */}
      <div className="hidden lg:flex w-1/2 py-5 pr-5">
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-muted">
          {isSignUp ? <AuthAnimation /> : <AuthImage />}
        </div>
      </div>
    </div>
  );
};

AuthLayout.displayName = 'AuthLayout';

export { AuthLayout };
