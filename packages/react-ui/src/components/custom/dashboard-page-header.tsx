import { BetaBadge } from '@/components/custom/beta-badge';

import { useEmbedding } from '../embed-provider';

export const DashboardPageHeader = ({
  title,
  children,
  description,
  beta = false,
}: {
  title: string;
  children?: React.ReactNode;
  description?: React.ReactNode;
  beta?: boolean;
}) => {
  const { embedState } = useEmbedding();
  if (embedState.hidePageHeader) {
    return null;
  }
  return (
    <div className="flex items-center justify-between border-b mb-4 py-2 min-w-full px-4 z-30 -mx-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{title}</h1>
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
      {children}
    </div>
  );
};
