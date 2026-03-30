import { t } from 'i18next';

import { PageHeader } from '@/components/custom/page-header';
import { Separator } from '@/components/ui/separator';

import { AIChatBox } from './ai-chat-box';
import { ConversationList } from './conversation-list';

export function ChatWithAIPage() {
  return (
    <div className="flex flex-col h-full -mx-4">
      <div style={{ padding: '8px' }}>
        <PageHeader
          title={t('AI Piecer')}
          showSidebarToggle={true}
          className="min-w-full !p-0"
        />
      </div>
      <Separator />
      <div className="flex-1 overflow-hidden" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10 }}>
          <ConversationList />
        </div>
        <AIChatBox />
      </div>
    </div>
  );
}
