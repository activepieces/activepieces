import { t } from 'i18next';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RedirectPage: React.FC = React.memo(() => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (window.opener && code) {
      window.opener.postMessage(
        {
          code: code,
        },
        '*',
      );
    }
  }, [location.search]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{t('The redirection works!')}</h1>
        <p className="text-muted-foreground">
          {t('You will be redirected in a few seconds.')}
        </p>
      </div>
    </div>
  );
});

RedirectPage.displayName = 'RedirectPage';
export { RedirectPage };
