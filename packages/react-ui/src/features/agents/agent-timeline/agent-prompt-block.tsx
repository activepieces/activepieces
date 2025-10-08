import { t } from 'i18next';
import { SparkleIcon } from 'lucide-react';

type AgentPromptBlockProps = {
  prompt: string;
};

export const AgentPromptBlock = ({ prompt }: AgentPromptBlockProps) => {
  return (
    <div className="animate-fade mb-3">
      <div className="flex items-center gap-2 mb-2">
        <SparkleIcon className="size-4 text-primary" />{' '}
        <div className="font-semibold">{t('Prompt')}</div>
      </div>
      <div>{prompt}</div>
    </div>
  );
};
