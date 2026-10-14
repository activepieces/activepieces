import { useSidebar } from '@/components/ui/sidebar-shadcn';

import { useBuilderStateContext } from '../builder-hooks';

export function useToggleBuilderChat() {
  const { open: isAppSidebarOpen, setOpen: setAppSidebarOpen } = useSidebar();
  const [
    setBuilderChatOpen,
    collapsedAppSidebarForChat,
    setCollapsedAppSidebarForChat,
  ] = useBuilderStateContext((state) => [
    state.setBuilderChatOpen,
    state.collapsedAppSidebarForChat,
    state.setCollapsedAppSidebarForChat,
  ]);

  return (open: boolean) => {
    setBuilderChatOpen(open);
    if (open && isAppSidebarOpen) {
      setAppSidebarOpen(false);
      setCollapsedAppSidebarForChat(true);
    }
    if (!open && collapsedAppSidebarForChat) {
      setAppSidebarOpen(true);
      setCollapsedAppSidebarForChat(false);
    }
  };
}
