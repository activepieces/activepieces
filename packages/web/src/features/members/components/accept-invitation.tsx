import { ErrorCode, isNil } from '@activepieces/core-utils';
import { InvitationStatus, UserInvitationPreview } from '@activepieces/shared';
import { t } from 'i18next';
import { Link2OffIcon, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { FullLogo } from '@/components/custom/full-logo';
import { LogoPlate } from '@/components/custom/logo-plate';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import {
  userInvitationMutations,
  userInvitationsHooks,
} from '../hooks/user-invitations-hooks';

const AcceptInvitation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const {
    data: invitation,
    isLoading,
    error,
    refetch,
  } = userInvitationsHooks.useInvitationPreview(token);
  const { mutate, isPending } = userInvitationMutations.useAcceptInvitation({
    onSuccess: (registered) => {
      if (registered) {
        navigate('/sign-in');
        return;
      }
      navigate(`/sign-up?email=${encodeURIComponent(invitation?.email ?? '')}`);
    },
    onError: (acceptError) => {
      if (api.isApError(acceptError, ErrorCode.ENTITY_NOT_FOUND)) {
        refetch();
        return;
      }
      internalErrorToast();
    },
  });

  if (isLoading) {
    return (
      <InvitationBackdrop>
        <LoadingSpinner className="size-6" />
      </InvitationBackdrop>
    );
  }
  if (token.length === 0 || api.isApError(error, ErrorCode.ENTITY_NOT_FOUND)) {
    return (
      <InvitationBackdrop>
        <InvitationPanel className="flex flex-col gap-6 p-8">
          <FullLogo className="h-6 self-start" />
          <div className="flex size-10 items-center justify-center rounded-xl bg-gray-3">
            <Link2OffIcon className="size-5 text-gray-11" />
          </div>
          <div className="flex flex-col gap-1">
            <h1
              className="text-lg font-semibold"
              data-testid="invitation-dead-link"
            >
              {t('This invitation is no longer valid')}
            </h1>
            <p className="text-sm text-gray-11">
              {t('If you already joined, sign in.')}
            </p>
          </div>
          <Button
            size="lg"
            className="w-full"
            data-testid="invitation-dead-link-sign-in"
            onClick={() => navigate('/sign-in')}
          >
            {t('Sign in')}
          </Button>
        </InvitationPanel>
      </InvitationBackdrop>
    );
  }
  if (!invitation) {
    return (
      <InvitationBackdrop>
        <InvitationPanel className="flex flex-col gap-6 p-8">
          <FullLogo className="h-6 self-start" />
          <DataFetchErrorState
            entity={t('invitation')}
            onRetry={() => refetch()}
          />
        </InvitationPanel>
      </InvitationBackdrop>
    );
  }
  return (
    <InvitationBackdrop>
      <InvitationPanel>
        <div className="relative h-28 overflow-hidden bg-accent-3 px-8 pt-6">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(var(--accent-7)_1px,transparent_1px)] bg-size-[14px_14px]"
          />
          <FullLogo className="relative h-6" />
        </div>
        <div className="relative flex flex-col gap-6 px-8 pb-8 pt-12">
          <PlatformLogo invitation={invitation} />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('Join {platformName}', {
                platformName: invitation.platformName,
              })}
            </h1>
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-gray-11">
              <Users className="size-3.5 shrink-0" />
              <span>
                {t('{count, plural, =1 {1 member} other {# members}}', {
                  count: invitation.memberCount,
                })}
              </span>
              <span aria-hidden className="hidden sm:inline">
                ·
              </span>
              <span
                className="basis-full break-all sm:basis-auto"
                data-testid="invitation-invited-as"
              >
                {t('Invited as {email}', { email: invitation.email })}
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              data-testid="invitation-accept-button"
              loading={isPending}
              onClick={() => mutate(token)}
            >
              {invitation.status === InvitationStatus.ACCEPTED
                ? t('Continue')
                : t('Accept invitation')}
            </Button>
            <p className="text-center text-xs text-gray-11">
              {t('Accept, then sign in or create your account.')}
            </p>
          </div>
        </div>
      </InvitationPanel>
    </InvitationBackdrop>
  );
};
AcceptInvitation.displayName = 'AcceptInvitation';

function InvitationBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-gray-2 px-4 py-10">
      {children}
    </main>
  );
}

function InvitationPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'w-full max-w-[420px] overflow-hidden rounded-xl border border-gray-6 bg-panel shadow-over animate-in fade-in zoom-in-95 duration-300 fill-mode-both',
        className,
      )}
    >
      {children}
    </section>
  );
}

function PlatformLogo({ invitation }: { invitation: UserInvitationPreview }) {
  return (
    <div className="absolute bottom-full left-8 translate-y-1/2">
      <LogoPlate
        src={invitation.platformLogoUrl ?? undefined}
        alt={invitation.platformName}
        size="xxl"
        border
        className={cn(
          'rounded-2xl shadow-panel ring-4 ring-panel',
          isNil(invitation.platformLogoUrl) && 'bg-accent-9',
        )}
        fallback={
          <span className="text-2xl font-semibold text-on-accent">
            {invitation.platformName.charAt(0).toUpperCase()}
          </span>
        }
      />
    </div>
  );
}

export { AcceptInvitation };
