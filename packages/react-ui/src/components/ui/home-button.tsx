import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from './button';
import { Tooltip, TooltipTrigger } from './tooltip';

import { authenticationSession } from '@/lib/authentication-session';

const HomeButtonWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Link to={authenticationSession.appendProjectRoutePrefix('/flows')}>
      {children}
    </Link>
  );
};
const HomeButton = () => {
  return (
    <Tooltip>
      <HomeButtonWrapper>
        <TooltipTrigger asChild>
          <Button variant="ghost" size={'icon'} className={'size-8'}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
      </HomeButtonWrapper>
    </Tooltip>
  );
};

HomeButton.displayName = 'HomeButton';

export { HomeButton };
