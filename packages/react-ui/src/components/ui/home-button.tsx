import { t } from 'i18next';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { ActivepiecesClientEventName } from 'ee-embed-sdk';

import { useEmbedding } from '../embed-provider';

import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

type HomeButtonProps = {
  route: string;
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
const HomeButton = ({ route }: HomeButtonProps) => {
  const { embedState } = useEmbedding();
  return (
    <>
      {!embedState.hideHomeButtonInBuilder && (
        <Tooltip>
          <HomeButtonWrapper route={route}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size={'icon'}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
          </HomeButtonWrapper>

          <TooltipContent side="bottom">{t('Go to Dashboard')}</TooltipContent>
        </Tooltip>
      )}
    </>
  );
};

HomeButton.displayName = 'HomeButton';

export { HomeButton };
