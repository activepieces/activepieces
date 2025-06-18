import { BetaBadge } from '@/components/custom/beta-badge';

export const TableTitle = ({
  children,
  description,
  beta = false,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
  beta?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{children}</h1>
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
