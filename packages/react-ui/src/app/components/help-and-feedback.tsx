import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { ChevronRight, BookOpen, History, VideoIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import TutorialsDialog from '@/components/custom/tutorials-dialog';
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
        <SidebarMenuButton className="px-2 py-5">
          <div className="flex items-center gap-2">
            <QuestionMarkCircledIcon className="size-4" />
            <span>{t('Help & Feedback')}</span>
          </div>
          <ChevronRight className="size-4 ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="w-[220px]">
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
              <span>{t('Changelog')}</span>
            </div>
          </Link>
        </DropdownMenuItem>

        <TutorialsDialog location="tutorials-sidebar-item" showTooltip={false}>
          <div className="flex items-center gap-2 text-sm px-2 py-1.5 cursor-pointer hover:bg-sidebar-accent rounded-sm transition-colors">
            <VideoIcon className="size-4" />
            <span>{t('Tutorials')}</span>
          </div>
        </TutorialsDialog>

        {showCommunity && (
          <>
            <div className="flex text-xs text-muted-foreground items-center gap-2 px-2 py-1">
              <span>Need Help?</span>
            </div>
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
