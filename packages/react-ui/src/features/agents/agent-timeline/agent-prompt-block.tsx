import { t } from 'i18next';
import { Sparkles } from 'lucide-react';

type AgentPromptBlockProps = {
  prompt: string;
};

export const AgentPromptBlock = ({ prompt }: AgentPromptBlockProps) => {
  return (
    <div className="mb-3">
      <div className="rounded-lg border bg-muted/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-medium">{t('Prompt')}</span>
        </div>
        <div className="text-sm pl-6">{prompt}</div>
      </div>
    </div>
  );
};
