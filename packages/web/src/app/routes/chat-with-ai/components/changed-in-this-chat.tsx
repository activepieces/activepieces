import { t } from 'i18next';
import { FilePen } from 'lucide-react';

import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Change } from '@/features/chat/lib/resources/change-summary';
import { useConversationChanges } from '@/features/chat/lib/use-conversation-changes';

import { resourceDisplay } from './resource-chip';

export function ChangedInThisChat({
  conversationId,
}: {
  conversationId: string;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <FilePen className="size-4" />
        {t('Changed in this chat')}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-64">
        <ChangeList conversationId={conversationId} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function ChangeList({ conversationId }: { conversationId: string }) {
  const {
    data: changes,
    isPending,
    isError,
  } = useConversationChanges(conversationId);
  if (isPending) {
    return <DropdownMenuItem disabled>{t('Loading…')}</DropdownMenuItem>;
  }
  if (isError) {
    return (
      <DropdownMenuItem disabled>
        {t("Couldn't load the changes.")}
      </DropdownMenuItem>
    );
  }
  if (changes.length === 0) {
    return (
      <DropdownMenuItem disabled>{t('Nothing changed yet.')}</DropdownMenuItem>
    );
  }
  return changes.map((change) => (
    <ChangeItem key={change.key} change={change} />
  ));
}

function ChangeItem({ change }: { change: Change }) {
  const Icon = resourceDisplay.icon(change.ref.kind);
  return (
    <DropdownMenuItem
      disabled={change.kind === 'deleted'}
      onSelect={() => resourceDisplay.openBeside(change.ref)}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">
        {resourceDisplay.name(change.ref)}
      </span>
      <span className="shrink-0 text-xs text-gray-10">
        {resourceDisplay.changeLabel(change.kind)}
      </span>
    </DropdownMenuItem>
  );
}
