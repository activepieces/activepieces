import { t } from 'i18next';
import { Cable, Settings, Sparkles, Table2, Workflow, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PromptSuggestion } from '@/components/prompt-kit/prompt-suggestion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { projectCollectionUtils } from '@/features/projects';

export function EmptyState({ incognito }: { incognito: boolean }) {
  const { project } = projectCollectionUtils.useCurrentProject();

  const greeting = incognito
    ? t('Private Chat')
    : t('What would you like to do in {projectName}?', {
        projectName: project.displayName,
      });

  return (
    <div className="flex items-center gap-3">
      <Sparkles className="h-7 w-7 text-primary shrink-0" />
      <h2
        className="text-[28px] font-bold leading-tight bg-gradient-to-r from-foreground via-foreground/80 to-primary bg-clip-text text-transparent"
        style={{ textWrap: 'balance' }}
      >
        {greeting}
      </h2>
    </div>
  );
}

export function SuggestionCards({
  onSend,
}: {
  onSend: (text: string, files?: File[]) => void;
}) {
  const suggestions = [
    { icon: Zap, text: t('What can I automate today?') },
    { icon: Workflow, text: t('Show me what I have running') },
    { icon: Table2, text: t('I keep doing something manually...') },
    { icon: Cable, text: t('Help me connect two apps') },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-3">
      {suggestions.map((s) => (
        <PromptSuggestion key={s.text} onClick={() => onSend(s.text)}>
          <s.icon className="h-3.5 w-3.5" />
          {s.text}
        </PromptSuggestion>
      ))}
    </div>
  );
}

export function SetupRequiredState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20 flex-1 min-w-0">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted">
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          {t('Set up Anthropic to get started')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {t(
            'AI Chat requires an Anthropic API key. Add your Anthropic provider in the AI settings to start chatting.',
          )}
        </p>
      </div>
      <Button onClick={() => navigate('/platform/setup/ai')} className="gap-2">
        <Settings className="h-4 w-4" />
        {t('Go to AI Settings')}
      </Button>
    </div>
  );
}

export function MessageSkeletons() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 py-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
