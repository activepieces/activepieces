import { t } from 'i18next';
import { Blocks, Compass, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type StartPoint = 'scratch' | 'template' | 'explore';

const OPTIONS: {
  value: StartPoint;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}[] = [
  {
    value: 'scratch',
    icon: Blocks,
    title: 'Start from scratch',
    description:
      'Build a workflow using triggers, actions and utilities.',
  },
  {
    value: 'template',
    icon: LayoutTemplate,
    title: 'Use a template',
    description:
      'Start with a preconfigured workflow and adapt it to your needs.',
  },
  {
    value: 'explore',
    icon: Compass,
    title: 'Explore Flow first',
    description:
      'Enter the product and look around before building anything.',
  },
];

export function StartPointStep({
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
          {t('Choose your starting point')}
        </h2>
        <p className="text-sm text-gray-11 mt-2">
          {t('You can change this later — nothing is locked in.')}
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
              <div className="text-sm text-gray-11 leading-relaxed">
                {t(opt.description)}
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
