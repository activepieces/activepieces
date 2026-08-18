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
  <div className="flex h-full flex-col items-center justify-center px-6 pt-[34px] pb-5">
    <div className="flex flex-col items-center gap-4">
      <AgentMark icon={icon} color={color} size="welcome" />
      <div className="flex flex-col items-center gap-[7px]">
        <span className="text-[22px] leading-7 font-semibold tracking-[-0.02em]">
          {t('Ask {name} anything', { name: displayName })}
        </span>
        {description !== null && (
          <span className="max-w-[400px] text-center text-sm leading-[150%] text-muted-foreground">
            {description}
          </span>
        )}
      </div>
    </div>
  </div>
);
