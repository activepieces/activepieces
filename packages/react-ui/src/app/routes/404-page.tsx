import { t } from 'i18next';
import { LucideIcon, SearchX } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotFoundPageProps {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  buttonText?: string;
  icon?: LucideIcon;
  buttonTo?: string;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({
  title = 'Page not found',
  description = "The page you're looking for doesn't exist or was removed.",
  showHomeButton = true,
  buttonText = 'Go to Home',
  icon: Icon = SearchX,
  buttonTo = '/',
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
      <div className="rounded-full bg-muted p-4">
        <Icon className="size-9 text-muted-foreground" />
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t(title)}</h2>
        <p className="text-sm text-muted-foreground">{t(description)}</p>
      </div>

      {showHomeButton && (
        <Link
          to={buttonTo}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          {t(buttonText)}
        </Link>
      )}
    </div>
  );
};

export default NotFoundPage;
