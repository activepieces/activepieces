import { t } from 'i18next';

import { PageHeader } from '@/components/custom/page-header';
import { Separator } from '@/components/ui/separator';

import { AIChatBox } from './ai-chat-box';

export function ChatWithAIPage() {
  return (
    <div className="flex flex-col h-full -mx-4">
      <PageHeader
        title={t('AI Builder')}
        showSidebarToggle={true}
        className="min-w-full"
        style={{ padding: '8px' }}
      />
      <Separator />
      <div className="flex-1 overflow-hidden">
        <AIChatBox />
      </div>
    </div>
  );
}
