import { t } from 'i18next';
import { LucideIcon, SearchX } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

interface NotFoundPageProps {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  buttonText?: string;
  icon?: LucideIcon;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({
  title = 'Oops! Page Not Found',
  description = "The page you're looking for isn't here. Want to try going back home?",
  showHomeButton = true,
  buttonText = 'Go Home',
  icon: Icon = SearchX,
}) => {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16 bg-background">
      <div className="mx-auto max-w-screen-sm text-center">
        <div className="mx-auto mb-8 flex justify-center">
          <Icon className="h-24 w-24" />
        </div>
        <p className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t(title)}
        </p>

        <p className="mb-4 text-lg font-light text-foreground">
          {t(description)}
        </p>
        {showHomeButton && (
          <Link to="/">
            <Button size="lg" variant={'default'}>
              {t(buttonText)}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotFoundPage;
