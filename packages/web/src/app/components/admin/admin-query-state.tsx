import { ReactNode } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { SkeletonList } from '@/components/ui/skeleton';

export function AdminQueryState({
  isLoading,
  isError,
  onRetry,
  entity,
  isEmpty = false,
  empty,
  skeleton,
  children,
}: AdminQueryStateProps) {
  if (isError) {
    return <DataFetchErrorState entity={entity} onRetry={onRetry} />;
  }
  if (isLoading) {
    return skeleton ?? <SkeletonList numberOfItems={3} className="h-18" />;
  }
  if (isEmpty && empty !== undefined) {
    return empty;
  }
  return children;
}

type AdminQueryStateProps = {
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => unknown;
  entity: string;
  isEmpty?: boolean;
  empty?: ReactNode;
  skeleton?: ReactNode;
  children: ReactNode;
};
