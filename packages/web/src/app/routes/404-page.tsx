import { t } from 'i18next';
import { LucideIcon, SearchX } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

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
    <main className="flex min-h-dvh w-full items-center justify-center bg-gray-1 p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
          <EmptyTitle>{t(title)}</EmptyTitle>
          <EmptyDescription>{t(description)}</EmptyDescription>
        </EmptyHeader>
        {showHomeButton && (
          <EmptyContent>
            <Button asChild>
              <Link to="/">{t(buttonText)}</Link>
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </main>
  );
};

export default NotFoundPage;
