import { ApFlagId, supportUrl } from '@activepieces/shared';
import { t } from 'i18next';
import { BookOpen, CircleHelp, History } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { flagsHooks } from '@/hooks/flags-hooks';

export const HelpAndFeedback = () => {
  const { data: showCommunity } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <CircleHelp />
        {t('Help & Feedback')}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-56">
        <DropdownMenuItem asChild>
          <Link
            to="https://activepieces.com/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen />
            <span>Documentation</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            to="https://github.com/activepieces/activepieces/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            <History />
            <span>{t('Changelog')}</span>
          </Link>
        </DropdownMenuItem>

        {showCommunity && (
          <>
            <DropdownMenuLabel>Need Help?</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to={supportUrl} target="_blank" rel="noopener noreferrer">
                <CircleHelp />
                <span>{t('Community Support')}</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
