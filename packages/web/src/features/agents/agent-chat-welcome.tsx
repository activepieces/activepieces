import { AgentIcon, ColorName } from '@activepieces/shared';
import { t } from 'i18next';

import { AgentMark } from './agent-mark';

type AgentChatWelcomeProps = {
  displayName: string;
  description: string | null;
  icon: AgentIcon;
  color: ColorName;
};

export const AgentChatWelcome = ({
  displayName,
  description,
  icon,
  color,
}: AgentChatWelcomeProps) => (
  <div className="flex h-full flex-col items-center justify-center p-6">
    <div className="flex flex-col items-center gap-4">
      <AgentMark icon={icon} color={color} size="welcome" />
      <div className="flex flex-col items-center gap-1">
        <span className="text-base font-semibold">
          {t('Ask {name} anything', { name: displayName })}
        </span>
        {description !== null && (
          <span className="max-w-md text-center text-sm text-gray-11">
            {description}
          </span>
        )}
      </div>
    </div>
  </div>
);
