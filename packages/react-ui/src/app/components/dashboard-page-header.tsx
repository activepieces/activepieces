import { useEmbedding } from '@/components/embed-provider';

export const DashboardPageHeader = ({
  title,
  children,
  description,
}: {
  title: string;
  children?: React.ReactNode;
  description?: React.ReactNode;
}) => {
  const { embedState } = useEmbedding();

  if (embedState.hidePageHeader) {
    return null;
  }
  return (
    <div className="flex items-center justify-between mb-6 min-w-full px-4 z-30 -mx-4">
      <div className="flex items-center justify-between w-full">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};
