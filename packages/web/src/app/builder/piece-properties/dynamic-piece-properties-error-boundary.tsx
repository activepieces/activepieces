import { t } from 'i18next';
import { RefreshCcw } from 'lucide-react';
import { useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Button } from '@/components/ui/button';

const DynamicPropertiesErrorBoundary = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [key, setKey] = useState(Date.now());
  const triedRerenderingRef = useRef(false);
  return (
    <ErrorBoundary
      key={key}
      fallback={
        !triedRerenderingRef.current ? (
          <div
            role="alert"
            className="text-sm text-destructive italic flex justify-between items-center"
          >
            {t('Unexpected error, please retry')}
            <Button
              size="icon"
              variant="outline"
              aria-label={t('Retry')}
              onClick={() => {
                setKey(Date.now());
                triedRerenderingRef.current = true;
              }}
            >
              {<RefreshCcw className="w-4 h-4 text-foreground!"></RefreshCcw>}{' '}
            </Button>
          </div>
        ) : (
          <div
            role="alert"
            className="text-sm text-destructive italic flex justify-between items-center"
          >
            {t('Unexpected error, please refresh the page or contact support')}
            <Button
              size="icon"
              variant="outline"
              aria-label={t('Refresh page')}
              onClick={() => {
                window.location.reload();
              }}
            >
              {<RefreshCcw className="w-4 h-4 text-foreground!"></RefreshCcw>}{' '}
            </Button>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
};
DynamicPropertiesErrorBoundary.displayName = 'DynamicPropertiesErrorBoundary';
export { DynamicPropertiesErrorBoundary };
