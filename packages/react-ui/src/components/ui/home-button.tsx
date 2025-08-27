import { t } from 'i18next';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { ActivepiecesClientEventName } from 'ee-embed-sdk';

import { useEmbedding } from '../embed-provider';

import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

type HomeButtonProps = {
  route: string;
  showBackButton?: boolean;
};

const HomeButtonWrapper = ({
  route,
  children,
}: {
  route: string;
  children: React.ReactNode;
}) => {
  const { embedState } = useEmbedding();
  if (embedState.emitHomeButtonClickedEvent) {
    const handleClick = () => {
      window.parent.postMessage(
        {
          type: ActivepiecesClientEventName.CLIENT_BUILDER_HOME_BUTTON_CLICKED,
          data: {
            route,
          },
        },
        '*',
      );
    };
    return <div onClick={handleClick}>{children}</div>;
  }
  return (
    <Link to={authenticationSession.appendProjectRoutePrefix(route)}>
      {children}
    </Link>
  );
};
const HomeButton = ({ route, showBackButton }: HomeButtonProps) => {
  const { embedState } = useEmbedding();
  const branding = flagsHooks.useWebsiteBranding();
  return (
    <>
      {!embedState.hideHomeButtonInBuilder && (
        <Tooltip>
          <HomeButtonWrapper route={route}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={'icon'}
                className={showBackButton ? 'size-8' : 'size-10'}
              >
                {!showBackButton && (
                  <img
                    className="h-5 w-5 object-contain"
                    src={branding.logos.logoIconUrl}
                    alt={branding.websiteName}
                  />
                )}
                {showBackButton && <ChevronLeft className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
          </HomeButtonWrapper>
          {!showBackButton && (
            <TooltipContent side="bottom">
              {t('Go to Dashboard')}
            </TooltipContent>
          )}
        </Tooltip>
      )}
    </>
  );
};

HomeButton.displayName = 'HomeButton';

export { HomeButton };
