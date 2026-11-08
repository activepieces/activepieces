import { t } from 'i18next';
import { ReactNode } from 'react';

import { CodeBlockCode } from '@/components/prompt-kit/code-block';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PreviewCodeTabs({
  value,
  onValueChange,
}: PreviewCodeTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (next === 'preview' || next === 'code') onValueChange(next);
      }}
    >
      <TabsList size="sm" className="h-7">
        <TabsTrigger value="preview" size="sm" className="h-6 font-medium">
          {t('Preview')}
        </TabsTrigger>
        <TabsTrigger value="code" size="sm" className="h-6 font-medium">
          {t('Code')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function PreviewWell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-gray-2 p-4 @max-chat-narrow/chat:p-3">{children}</div>
  );
}

export function PreviewCodeBody({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  return (
    <CodeBlockCode
      code={code}
      language={language}
      className="max-h-[360px] bg-gray-2 @max-chat-narrow/chat:[&_pre]:whitespace-pre-wrap @max-chat-narrow/chat:[&_pre]:break-words"
    />
  );
}

export type PreviewCodeTab = 'preview' | 'code';

type PreviewCodeTabsProps = {
  value: PreviewCodeTab;
  onValueChange: (value: PreviewCodeTab) => void;
};
