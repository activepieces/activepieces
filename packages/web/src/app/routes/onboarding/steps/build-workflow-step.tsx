import { t } from 'i18next';
import { ArrowRight, Blocks, Compass, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';

type StartPoint = 'scratch' | 'template' | 'explore';

const OPTIONS: {
  value: StartPoint;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
}[] = [
  {
    value: 'scratch',
    icon: Blocks,
    title: 'Start from scratch',
    description:
      'Open the builder with a blank canvas. Pick a trigger, add actions, run a test.',
    cta: 'Open the builder',
  },
  {
    value: 'template',
    icon: LayoutTemplate,
    title: 'Start from a template',
    description:
      'Browse pre-built workflows you can adapt. We will show you what is available.',
    cta: 'See templates',
  },
  {
    value: 'explore',
    icon: Compass,
    title: 'Explore first',
    description:
      'Take a look around. See the integrations catalogue and example workflows.',
    cta: 'Explore',
  },
];

export function BuildWorkflowStep({
  onChoose,
  onSkip,
}: {
  onChoose: (point: StartPoint) => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col max-w-3xl mx-auto gap-6 py-8">
      <div>
        <h2 className="text-2xl font-semibold">
          {t('Build your first workflow')}
        </h2>
        <p className="text-sm text-gray-11 mt-2">
          {t(
            'Pick how you want to start. We will walk you through it once you are in the builder.',
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChoose(opt.value)}
              className="rounded-lg border border-gray-6 p-5 text-left hover:border-primary hover:bg-primary/5 transition-colors flex flex-col gap-3"
            >
              <Icon className="h-6 w-6 text-primary" />
              <div className="font-medium">{t(opt.title)}</div>
              <div className="text-sm text-gray-11 leading-relaxed flex-1">
                {t(opt.description)}
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-primary mt-2">
                {t(opt.cta)}
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onSkip}>
          {t('Skip setup')}
        </Button>
      </div>
    </div>
  );
}
