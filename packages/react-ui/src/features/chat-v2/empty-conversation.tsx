import { t } from 'i18next';

import quickLogoUrl from '@/assets/img/custom/quick-logo.svg';

export function EmptyConversation() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 mt-16">
      <div className="text-center">
        <img
          src={quickLogoUrl}
          alt="Quick Logo"
          className="size-20 mb-6 opacity-80 mx-auto"
        />
        <h2 className="text-2xl font-semibold mb-2">
          {t('Welcome to Quick Assistant')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Start a conversation to get assistance with automation, workflows, and
          more
        </p>
      </div>
    </div>
  );
}
