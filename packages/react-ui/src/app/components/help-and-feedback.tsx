import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { BookOpen, History } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId, supportUrl } from '@activepieces/shared';

export const HelpAndFeedback = () => {
  const { data: showCommunity } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center w-full text-left px-2 py-1.5 text-sm rounded-sm cursor-pointer">
        <QuestionMarkCircledIcon className="w-4 h-4 mr-2" />
        {t('Help & Feedback')}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-[220px]">
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
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
