import { ChatConversation } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronDown,
  CircleCheck,
  EllipsisVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConversationStatusDot } from '@/app/routes/chat-with-ai/components/conversation-status-dot';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { Skeleton } from '@/components/ui/skeleton';
import { chatApi } from '@/features/chat/lib/chat-api';
import {
  chatConversationsCache,
  useChatConversations,
} from '@/features/chat/lib/chat-conversations';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { useConversationIndicators } from '@/features/chat/lib/use-conversation-indicators';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { useChatNavigation } from '../../workspace-shell/use-chat-navigation';

export function SidebarConversations() {
  const { state } = useSidebar();
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const [listCollapsed, setListCollapsed] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // The persistent chat panel mirrors the `?chat=` param wherever we are, so the
  // param is the single source of truth for the active conversation.
  const {
    selectedConversationId: activeConversationId,
    selectConversation,
    newChat,
  } = useChatNavigation();

  const { data: conversationsPage, isLoading } = useChatConversations();

  const conversations = conversationsPage?.data ?? [];

  const { getIndicator, markRead } = useConversationIndicators({
    conversations,
    activeId: activeConversationId,
  });

  const { mutate: renameConversation } = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      chatApi.updateConversation(id, { title }),
    onMutate: ({ id, title }) => {
      chatConversationsCache.patchTitle({
        queryClient,
        conversationId: id,
        title,
      });
    },
    onSettled: () => {
      chatConversationsCache.invalidate({ queryClient });
    },
  });

  const deleteConversation = async () => {
    if (!deleteTargetId) {
      return;
    }
    await chatApi.deleteConversation(deleteTargetId);
    toast(t('Chat deleted.'), {
      icon: <CircleCheck className="size-4" />,
    });
    chatConversationsCache.invalidate({ queryClient });
    if (activeConversationId === deleteTargetId) {
      newChat();
    }
  };

  if (state === 'collapsed' || !platform.plan.chatEnabled) {
    return null;
  }

  const handleConversationClick = (conversation: ChatConversation) => {
    markRead(conversation.id);
    selectConversation(conversation.id);
  };

  return (
    <SidebarGroup className="py-1">
      <button
        type="button"
        className="flex w-fit shrink-0 items-center gap-0.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setListCollapsed((prev) => !prev)}
      >
        {t('Chat')}
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 transition-transform duration-150',
            listCollapsed && '-rotate-90',
          )}
        />
      </button>
      {!listCollapsed && (
        <div>
          {isLoading ? (
            <div className="flex flex-col gap-2 px-2 pt-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full rounded-md" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              {t('Start your first chat')}
            </p>
          ) : (
            <SidebarMenu>
              {conversations.map((conversation) => {
                const isActive = activeConversationId === conversation.id;
                const isMenuOpen = menuOpenId === conversation.id;
                const isEditing = renameTargetId === conversation.id;
                const indicator = getIndicator(conversation);
                const commitRename = () => {
                  setRenameTargetId(null);
                  const title = renameValue.trim();
                  const currentTitle = conversation.title
                    ? chatUtils.sanitizeTitle(conversation.title)
                    : '';
                  if (title && title !== currentTitle) {
                    renameConversation({ id: conversation.id, title });
                  }
                };
                if (isEditing) {
                  return (
                    <SidebarMenuItem key={conversation.id}>
                      <input
                        autoFocus
                        dir="auto"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onFocus={(e) => {
                          const input = e.currentTarget;
                          input.select();
                          // Focusing scrolls the field to the caret at the
                          // text's end; snap back so the title reads from its
                          // (direction-aware) start.
                          requestAnimationFrame(() => {
                            input.scrollLeft = 0;
                          });
                        }}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            commitRename();
                          }
                          if (e.key === 'Escape') {
                            setRenameTargetId(null);
                          }
                        }}
                        className="flex h-7 w-full items-center rounded-md border border-foreground bg-background p-2 text-sm text-foreground outline-none"
                      />
                    </SidebarMenuItem>
                  );
                }
                return (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      className={cn(
                        'group/conversation relative pr-1 text-muted-foreground/80 hover:text-foreground',
                        {
                          'bg-sidebar-accent hover:bg-sidebar-accent! text-foreground':
                            isActive,
                          'bg-sidebar-accent text-foreground': isMenuOpen,
                        },
                      )}
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <span
                        className={cn(
                          'flex-1 truncate text-sm',
                          isActive ? 'font-semibold' : 'font-normal',
                        )}
                      >
                        {conversation.title
                          ? chatUtils.sanitizeTitle(conversation.title)
                          : t('New conversation')}
                      </span>
                      {indicator && (
                        <span
                          className={cn(
                            'absolute right-2 top-1/2 -translate-y-1/2 transition-opacity group-hover/conversation:opacity-0',
                            (isMenuOpen || isActive) && 'opacity-0',
                          )}
                        >
                          <ConversationStatusDot state={indicator} />
                        </span>
                      )}
                      <DropdownMenu
                        open={isMenuOpen}
                        onOpenChange={(open) =>
                          setMenuOpenId(open ? conversation.id : null)
                        }
                      >
                        <DropdownMenuTrigger asChild>
                          <span
                            role="button"
                            tabIndex={0}
                            className={cn(
                              'shrink-0 items-center justify-center rounded-md p-1 text-foreground hover:bg-accent',
                              isMenuOpen && 'bg-accent',
                              isMenuOpen || isActive
                                ? 'flex'
                                : 'hidden group-hover/conversation:flex',
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <EllipsisVertical className="size-3.5" />
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side="bottom"
                          align="start"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                          // Rendered in a portal but still a React child of the
                          // row button, so clicks bubble up the React tree and
                          // would navigate to the conversation.
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setMenuOpenId(null);
                              setRenameValue(
                                conversation.title
                                  ? chatUtils.sanitizeTitle(conversation.title)
                                  : '',
                              );
                              setRenameTargetId(conversation.id);
                            }}
                          >
                            <div className="flex cursor-pointer flex-row items-center gap-2">
                              <Pencil className="size-4" />
                              <span>{t('Rename')}</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => {
                              e.preventDefault();
                              setMenuOpenId(null);
                              setDeleteTargetId(conversation.id);
                            }}
                          >
                            <div className="flex cursor-pointer flex-row items-center gap-2">
                              <Trash2 className="size-4" />
                              <span>{t('Delete')}</span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          )}
        </div>
      )}
      <ConfirmationDeleteDialog
        title={t('Delete chat')}
        message={t('Are you sure you want to delete this chat?')}
        entityName="chat"
        buttonText={t('Delete')}
        mutationFn={deleteConversation}
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetId(null);
          }
        }}
        onError={() => toast.error(t('Failed to delete conversation'))}
      />
    </SidebarGroup>
  );
}
