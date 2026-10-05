import { t } from 'i18next';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export function MobileSidebarBar({ title }: { title: string }) {
  const { isMobile, setOpenMobile } = useSidebar();
  if (!isMobile) {
    return null;
  }
  return (
    <div className="flex shrink-0 items-center gap-2 border-b bg-gray-1 px-2 py-1.5">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('Open menu')}
        onClick={() => setOpenMobile(true)}
      >
        <Menu />
      </Button>
      <span className="truncate text-sm font-medium text-gray-12">{title}</span>
    </div>
  );
}
