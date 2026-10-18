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
          "You can't do this while single sign-on is the only way to sign in. Turn on email or Google sign-in first.",
        )}
      </span>
    )}
  </span>
);
