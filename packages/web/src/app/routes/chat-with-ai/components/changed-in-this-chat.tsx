import { t } from 'i18next';

import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChangeLine } from '@/features/chat/lib/resources/change-summary';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import { useConversationChanges } from '@/features/chat/lib/use-conversation-changes';

import { describeChange, onResourceLinkClick } from './changes-summary';
import { useResourceName } from './resource-chip';

export function ChangedInThisChat({
  conversationId,
}: {
  conversationId: string | null;
}) {
  const lines = useConversationChanges(conversationId);
  return (
    <>
      <DropdownMenuLabel className="text-xs font-normal text-gray-11">
        {t('Changed in this chat')}
      </DropdownMenuLabel>
      {lines.length === 0 ? (
        <DropdownMenuItem disabled>{t('Nothing changed yet')}</DropdownMenuItem>
      ) : (
        lines.map((line) => <ChangedItem key={line.key} line={line} />)
      )}
    </>
  );
}

function ChangedItem({ line }: { line: ChangeLine }) {
  const { icon: Icon, label } = resourceRegistry.kindInfo(line.ref.kind);
  const name = useResourceName(line.ref) ?? label;
  const content = (
    <>
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{describeChange({ line, name })}</span>
    </>
  );
  if (line.facts.deleted) {
    return <DropdownMenuItem disabled>{content}</DropdownMenuItem>;
  }
  return (
    <DropdownMenuItem asChild>
      <a
        href={resourceRegistry.route(line.ref)}
        onClick={(event) => onResourceLinkClick({ event, resource: line.ref })}
      >
        {content}
      </a>
    </DropdownMenuItem>
  );
}
