import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type BaseCardProps = {
  image: React.ReactNode;
  title?: string | null;
  description?: string | null;
  onClick?: () => void;
  version?: string;
};

const BaseCard: React.FC<BaseCardProps> = ({
  image,
  title,
  description,
  onClick,
  version,
}) => {
  return (
    <div onClick={onClick} className="flex items-center justify-center gap-4">
      <div className="flex h-full min-w-[48px] items-center justify-center">
        {image}
      </div>
      <div className="flex h-full grow flex-col justify-center gap-1 text-start">
        <div className="text-base flex justify-center">
          <div className="flex-grow">
            {title != null ? (
              title
            ) : (
              <Skeleton className="h-5 w-32 rounded" />
            )}
          </div>
          {version && (
            <div className="text-xs text-muted-foreground flex justify-center items-center">
              v{version}
            </div>
          )}
        </div>
        <div className="overflow-hidden text-ellipsis text-xs text-muted-foreground">
          {description != null ? (
            description
          ) : (
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { BaseCard }; 