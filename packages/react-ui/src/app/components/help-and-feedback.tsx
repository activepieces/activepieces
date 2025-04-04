import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { ChevronRight, BookOpen, History } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId, supportUrl } from '@activepieces/shared';

export const HelpAndFeedback = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: showCommunity } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="w-full justify-between hover:bg-accent hover:text-primary rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <QuestionMarkCircledIcon className="size-4" />
            <span>Help & Feedback</span>
          </div>
          <ChevronRight className="size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-[220px]">
        <DropdownMenuItem asChild>
          <Link
            to="https://activepieces.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="size-4" />
              <span>Documentation</span>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            to="https://github.com/activepieces/activepieces/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <History className="size-4" />
              <span>Changelog</span>
            </div>
          </Link>
        </DropdownMenuItem>

        <div className="flex text-xs text-muted-foreground items-center gap-2 px-2 py-1">
          <span>Need Help?</span>
        </div>

        {showCommunity && (
          <DropdownMenuItem asChild>
            <Link
              to={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <QuestionMarkCircledIcon className="size-4" />
                <span>{t('Community Support')}</span>
              </div>
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
