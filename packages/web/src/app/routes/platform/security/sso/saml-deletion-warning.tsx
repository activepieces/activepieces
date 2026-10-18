import { t } from 'i18next';

export const SamlDeletionWarning = ({
  otherMethodsOff,
}: {
  otherMethodsOff: boolean;
}) => (
  <span className="flex flex-col gap-1">
    <span>
      {t('This disables single sign-on and deletes its SAML connection.')}
    </span>
    {otherMethodsOff && (
      <span>
        {t(
          'Email and Google sign-in are off. Turn one on first so people can still sign in.',
        )}
      </span>
    )}
  </span>
);
