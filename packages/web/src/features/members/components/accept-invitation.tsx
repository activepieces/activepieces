import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { LoadingSpinner } from '@/components/custom/spinner';
import { internalErrorToast } from '@/components/ui/sonner';
import { AuthCard, AuthPage } from '@/features/authentication';

import { api } from '../../../lib/api';
import { userInvitationMutations } from '../hooks/user-invitations-hooks';

const AcceptInvitation = () => {
  const [isInvitationLinkValid, setIsInvitationLinkValid] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate, isPending } = userInvitationMutations.useAcceptInvitation({
    onSuccess: (registered) => {
      setIsInvitationLinkValid(true);
      if (!registered) {
        setTimeout(() => {
          const email = searchParams.get('email');
          navigate(`/sign-up?email=${email}`);
        }, 3000);
      } else {
        navigate('/sign-in');
      }
    },
    onError: (error) => {
      setIsInvitationLinkValid(false);
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.InternalServerError: {
            console.log(error);
            internalErrorToast();
            break;
          }
          default: {
            break;
          }
        }
      }
    },
  });
  useEffect(() => {
    const invitationToken = searchParams.get('token');
    if (!invitationToken) {
      setIsInvitationLinkValid(false);
      return;
    }
    mutate(invitationToken);
  }, [mutate, searchParams]);

  return (
    <AuthPage>
      {isPending ? (
        <div className="flex justify-center">
          <LoadingSpinner isLarge={true}></LoadingSpinner>
        </div>
      ) : isInvitationLinkValid ? (
        <AuthCard
          title={t('Team Invitation Accepted')}
          description={t(
            'Thank you for accepting the invitation. We are redirecting you right now...',
          )}
        />
      ) : (
        <AuthCard>
          <p className="text-sm text-danger-11">
            {t('Invalid invitation token. Please try again.')}
          </p>
        </AuthCard>
      )}
    </AuthPage>
  );
};
AcceptInvitation.displayName = 'AcceptInvitation';
export { AcceptInvitation };
