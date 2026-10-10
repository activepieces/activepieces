import { t } from 'i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WelcomeStep({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-6 py-12">
      <div className="text-5xl font-semibold tracking-tight">
        {t('Your workflows start here.')}
      </div>
      <p className="text-lg text-gray-11 leading-relaxed">
        {t(
          'Connect the tools you use, automate repetitive work, and build workflows that run for you.',
        )}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-4">
        <Button size="lg" onClick={onStart} className="gap-2">
          {t('Get started')}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button size="lg" variant="ghost" onClick={onSkip}>
          {t('Skip setup')}
        </Button>
      </div>
    </div>
  );
}
