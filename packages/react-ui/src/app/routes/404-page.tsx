import { t } from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
      <div className="mx-auto max-w-screen-sm text-center">
        <h1 className="mb-4 text-7xl font-extrabold tracking-tight text-primary lg:text-9xl">
          404
        </h1>
        <p className="mb-4 text-3xl font-bold tracking-tight text-muted-foreground md:text-4xl">
          {t("Something's missing.")}
        </p>
        <p className="mb-4 text-lg font-light text-muted-foreground">
          {t(
            "Sorry, we can't find that page. You'll find lots to explore on the home page.",
          )}
        </p>
        <Link to="/flows">
          <Button size="lg">{t('Back to Homepage')}</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
