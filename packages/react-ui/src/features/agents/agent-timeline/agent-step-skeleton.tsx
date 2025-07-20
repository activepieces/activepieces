import { t } from 'i18next';
import { useEffect, useState } from 'react';

import ImageWithFallback from '@/components/ui/image-with-fallback';
import { agentHooks } from '../lib/agent-hooks';

type AgentStepSkeletonProps = {
  agentId: string;
};

export const AgentStepSkeleton = ({ agentId }: AgentStepSkeletonProps) => {
  const { data: agent } = agentHooks.useGet(agentId);
  const [dots, setDots] = useState('...');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev === '....' ? '.' : `${prev}.`));
    }, 250);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex items-center px-4 py-3 text-sm font-medium gap-3">
      <ImageWithFallback
        src={agent?.profilePictureUrl}
        alt={agent?.displayName}
        className="size-8"
      ></ImageWithFallback>
      {`${t('Working my magic')} ${dots}`}
    </div>
  );
}; 