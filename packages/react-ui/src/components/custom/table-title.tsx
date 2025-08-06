import { VideoIcon } from 'lucide-react';

import { BetaBadge } from '@/components/custom/beta-badge';

import { Button } from '../ui/button';

import TutorialsDialog, { TabType } from './tutorials-dialog';

export const TableTitle = ({
  children,
  description,
  beta = false,
  tutorialTab,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
  beta?: boolean;
  tutorialTab?: TabType;
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{children}</h1>
          {tutorialTab && (
            <TutorialsDialog initialTab={tutorialTab}>
              <Button variant="outline-primary" size="icon">
                <VideoIcon className="size-4"></VideoIcon>
              </Button>
            </TutorialsDialog>
          )}
          {beta && (
            <div className="flex items-center">
              <BetaBadge />
            </div>
          )}
        
        </div>
        {description && (
          <span className="text-md text-muted-foreground">{description}</span>
        )}
      </div>
    </div>
  );
};
TableTitle.displayName = 'TableTitle';
