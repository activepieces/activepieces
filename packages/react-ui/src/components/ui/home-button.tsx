import { t } from 'i18next';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { useEmbedding } from '../embed-provider';

import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

type HomeButtonProps = {
  route: string;
  showBackButton?: boolean;
};

const HomeButton = ({ route, showBackButton }: HomeButtonProps) => {
  const { embedState } = useEmbedding();
  const branding = flagsHooks.useWebsiteBranding();
  return (
    <>
      {!embedState.hideLogoInBuilder &&
        !embedState.disableNavigationInBuilder && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={authenticationSession.appendProjectRoutePrefix(route)}>
                <Button
                  variant="ghost"
                  size={'icon'}
                  className={showBackButton ? 'size-8' : 'size-10'}
                >
                  {!showBackButton && (
                    <img
                      className="h-7 w-7 object-contain"
                      src={branding.logos.logoIconUrl}
                      alt={branding.websiteName}
                    />
                  )}
                  {showBackButton && <ChevronLeft className="h-4 w-4" />}
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {!showBackButton && t('Go to Dashboard')}
            </TooltipContent>
          </Tooltip>
        )}
    </>
  );
};

HomeButton.displayName = 'HomeButton';

export { HomeButton };
