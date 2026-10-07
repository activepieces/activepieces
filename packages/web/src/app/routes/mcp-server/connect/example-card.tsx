import { t } from 'i18next';
import { Check } from 'lucide-react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';

import { ConnectHome } from './use-connect-home';

export function ExampleCard({
  home,
  className,
}: {
  home: ConnectHome;
  className?: string;
}) {
  const steps = [
    { tool: 'ap_list_runs', label: t('Found this week’s failed runs') },
    { tool: 'ap_get_run', label: t('Read the step that failed') },
    { tool: 'ap_update_step', label: t('Fixed the step’s input') },
    { tool: 'ap_test_flow', label: t('Tested the flow') },
  ];

  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-6 rounded-xl border bg-panel p-6',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <ClientIcon
          icon={home.exampleClient.icon}
          className="size-5 rounded-md"
        />
        <span className="flex-1 text-sm font-medium">
          {home.exampleClient.name}
        </span>
        <span className="text-xs text-gray-11">{t('Example')}</span>
      </div>

      <div className="flex flex-col gap-4">
        <p className="max-w-[80%] self-end rounded-xl bg-gray-3 px-4 py-2.5 text-sm">
          {t('Which of my flows failed this week? Fix it and test it again.')}
        </p>
        <ol className="flex flex-col gap-2">
          {steps.map((step, index) => (
            <li
              key={step.tool}
              style={{ animationDelay: `${150 + index * 250}ms` }}
              className="flex items-center gap-3 text-sm animate-in fade-in slide-in-from-left-1 duration-500 fill-mode-both motion-reduce:animate-none"
            >
              <Check className="size-4 shrink-0 text-success-11" />
              <span className="font-mono text-xs text-gray-12">
                {step.tool}
              </span>
              <span className="text-gray-11">{step.label}</span>
            </li>
          ))}
        </ol>
        <p
          style={{ animationDelay: `${150 + steps.length * 250}ms` }}
          className="text-sm animate-in fade-in duration-500 fill-mode-both motion-reduce:animate-none"
        >
          {t(
            'Done. The flow was failing on one step’s input. I fixed it and the test run passed.',
          )}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t pt-6">
        <span className="text-sm font-medium">{t('Try asking')}</span>
        <div className="flex flex-wrap gap-2">
          {home.prompts.map((prompt) => (
            <CopyButton
              key={prompt}
              textToCopy={prompt}
              variant="secondary"
              size="sm"
              className="max-w-full font-normal"
            >
              <span className="truncate">{prompt}</span>
            </CopyButton>
          ))}
        </div>
      </div>
    </section>
  );
}
