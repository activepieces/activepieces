import { VideoIcon } from 'lucide-react';

import { BetaBadge } from '@/components/custom/beta-badge';

import { useEmbedding } from '../embed-provider';
import { Button } from '../ui/button';

import TutorialsDialog, { TabType } from './tutorials-dialog';

export const DashboardPageHeader = ({
  title,
  children,
  description,
  beta = false,
  middleChildren,
  tutorialTab,
}: {
  title: string;
  children?: React.ReactNode;
  description?: React.ReactNode;
  beta?: boolean;
  middleChildren?: React.ReactNode;
  tutorialTab?: TabType;
}) => {
  const className = middleChildren
    ? 'grid grid-cols-3'
    : 'flex justify-between';

  const { embedState } = useEmbedding();
  if (embedState.hidePageHeader) {
    return null;
  }
  return (
    <div
      className={`${className} items-center border-b bg-background py-3 px-6 -mx-4 mb-4`}
    >
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          {tutorialTab && (
            <TutorialsDialog location="table-title" initialTab={tutorialTab}>
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
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      {middleChildren && (
        <div className="flex justify-center">{middleChildren}</div>
      )}
      <div className="flex justify-end">{children}</div>
    </div>
  );
};
