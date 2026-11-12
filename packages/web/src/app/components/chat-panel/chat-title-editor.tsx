import { t } from 'i18next';
import { useRef } from 'react';

import EditableText from '@/components/custom/editable-text';
import { chatDom } from '@/features/chat/lib/chat-dom';

export function ChatTitleEditor({
  title,
  className,
  onRename,
  onDone,
}: {
  title: string;
  className?: string;
  onRename: (title: string) => void;
  onDone: (endedByKey: boolean) => void;
}) {
  const endedByKey = useRef(false);
  return (
    <div
      className={className}
      onKeyDownCapture={(event) => {
        const enter = event.key === 'Enter' && !event.nativeEvent.isComposing;
        if (enter) event.preventDefault();
        if (enter || event.key === 'Escape') endedByKey.current = true;
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') chatDom.claimEscape(event.nativeEvent);
      }}
    >
      <EditableText
        ariaLabel={t('Chat title')}
        value={title}
        readonly={false}
        isEditing
        setIsEditing={(editing) => {
          if (!editing) onDone(endedByKey.current);
        }}
        onValueChange={onRename}
        className="min-w-0 flex-1 truncate whitespace-nowrap"
      />
    </div>
  );
}
