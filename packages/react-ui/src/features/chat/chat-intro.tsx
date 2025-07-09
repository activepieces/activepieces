import React from 'react';

import { ChatUIResponse } from '@activepieces/shared';

interface ChatIntroProps {
  chatUI: ChatUIResponse | null | undefined;
  botName: string;
}

export function ChatIntro({ chatUI, botName }: ChatIntroProps) {
  return (
    <div className="flex items-center justify-center py-8 px-4 font-bold">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center p-3 rounded-full">
          <img
            src={chatUI?.platformLogoUrl}
            alt="Bot Avatar"
            className="w-10 h-10"
          />
        </div>
        <div className="flex items-center gap-1 justify-center">
          <p className="animate-typing overflow-hidden whitespace-nowrap pr-1 hidden lg:block lg:text-xl text-foreground leading-8">
            Hi! I&apos;m {botName} 👋 How can I help you today?
          </p>
          <p className="animate-typing-sm overflow-hidden whitespace-nowrap pr-1 lg:hidden text-xl text-foreground leading-8">
            Hi! I&apos;m {botName} 👋
          </p>
          <span className="w-4 h-4 rounded-full bg-foreground animate-[fade_0.15s_ease-out_forwards_0.7s_reverse]" />
        </div>
      </div>
    </div>
  );
}
