import { SearchRemoveIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';

interface NotFoundPageProps {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  buttonText?: string;
  icon?: IconSvgElement;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({
  title = 'Oops! Page Not Found',
  description = "The page you're looking for isn't here. Want to try going back home?",
  showHomeButton = true,
  buttonText = 'Go Home',
  icon: Icon = SearchRemoveIcon,
}) => {
  return (
    <div className="mx-auto max-w-(--breakpoint-xl) px-4 py-8 lg:px-6 lg:py-16 bg-gray-1">
      <div className="mx-auto max-w-(--breakpoint-sm) text-center">
        <div className="mx-auto mb-8 flex justify-center">
          <HugeiconsIcon icon={Icon} className="h-24 w-24" />
        </div>
        <p className="mb-4 text-3xl font-bold tracking-tight text-gray-12 md:text-4xl">
          {t(title)}
        </p>

        <p className="mb-4 text-lg font-light text-gray-12">{t(description)}</p>
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
