import React from 'react';

import { BaseCard } from './base-card';
import { Action, Trigger } from '@activepieces/shared';
import { agentHooks } from '../../../routes/agents/agent-hooks';
import ImageWithFallback from '@/components/ui/image-with-fallback';

type AgentCardProps = {
  step: Action | Trigger;
  onClick?: () => void;
  agentId: string;
};

const AgentCard: React.FC<AgentCardProps> = ({ step, onClick, agentId }) => {

  const { data: agent } = agentHooks.useGet(agentId);

  const title = agent?.displayName;
  const description = agent?.description;
  const agentImage = agent?.profilePictureUrl;

  return (
    <BaseCard
      image={<ImageWithFallback src={agentImage} alt={title} className="w-12 h-12 " />}
      title={title}
      description={description}
      onClick={onClick}
    />
  );
};

export { AgentCard }; 