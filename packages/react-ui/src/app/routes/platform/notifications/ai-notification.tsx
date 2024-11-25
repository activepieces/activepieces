import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { SparklesIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { aiProviderApi } from '@/features/platform-admin-panel/lib/ai-provider-api';

const AINotification = () => {
  const navigate = useNavigate();
  const { data: providers } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => aiProviderApi.list(),
  });

  if (providers && providers.data.length > 0) {
    return null;
  }
  return (
    <Alert variant="primary" className="flex items-start">
      <SparklesIcon className="h-4 w-4" />
      <div className="flex-grow">
        <AlertTitle>
          {t('Hey! Your Universal AI needs a quick setup')}
        </AlertTitle>
        <AlertDescription>
          {t(
            "I noticed you haven't set up any AI providers yet. To unlock Universal AI pieces for your team, you'll need to configure some provider credentials first.",
          )}
        </AlertDescription>
      </div>
      <Button
        variant="link"
        className="text-primary-300"
        onClick={() => navigate('/platform/settings/ai')}
      >
        {t('Configure')}
      </Button>
    </Alert>
  );
};

AINotification.displayName = 'AINotification';
export { AINotification };
