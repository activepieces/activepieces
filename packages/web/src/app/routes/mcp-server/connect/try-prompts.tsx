import { t } from 'i18next';
import { Hammer, LucideIcon, Play, Plug, Search } from 'lucide-react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';

import { mcpWorkspaceHooks } from './workspace-examples';

export function TryPrompts() {
  const prompts = useTryPrompts();
  return (
    <ul className="flex flex-col gap-1.5">
      {prompts.map((prompt) => (
        <li
          key={prompt.kind}
          className="flex items-center gap-3 rounded-xl border bg-gray-2 py-1 pr-1 pl-3"
        >
          <prompt.icon aria-hidden className="size-4 shrink-0 text-gray-11" />
          <span className="min-w-0 flex-1 py-1.5 text-sm text-pretty text-gray-12">
            {prompt.text}
          </span>
          <CopyButton
            textToCopy={prompt.text}
            variant="ghost"
            size="icon-sm"
            aria-label={t('Copy prompt')}
          />
        </li>
      ))}
    </ul>
  );
}

function useTryPrompts(): TryPrompt[] {
  const { projectName, flowName, appName } = mcpWorkspaceHooks.useExamples();

  return [
    {
      kind: 'look',
      icon: Search,
      text: projectName
        ? t('Which of my flows in {project} failed this week, and why?', {
            project: projectName,
          })
        : t('Which of my flows failed this week, and why?'),
    },
    {
      kind: 'run',
      icon: Play,
      text: flowName
        ? t('Run “{flow}” now and tell me what it did.', { flow: flowName })
        : t('Show me the runs from the last 24 hours.'),
    },
    {
      kind: 'act',
      icon: Plug,
      text: appName
        ? t('What can you do with my {app} connection? Do one useful thing.', {
            app: appName,
          })
        : t('Which apps can you reach from here, and what can you do in them?'),
    },
    {
      kind: 'build',
      icon: Hammer,
      text: t(
        'Build a flow that sends me a message every morning with yesterday’s failed runs, then turn it on.',
      ),
    },
  ];
}

type TryPrompt = {
  kind: 'look' | 'run' | 'act' | 'build';
  icon: LucideIcon;
  text: string;
};
