import { t } from 'i18next';
import { ComponentProps, ReactNode } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { SkeletonList } from '@/components/ui/skeleton';

export function AdminQueryState({
  isLoading,
  isError,
  hasData = false,
  onRetry,
  entity,
  isEmpty = false,
  empty,
  skeleton,
  children,
}: AdminQueryStateProps) {
  if (isError && !hasData) {
    return <AdminFetchErrorState entity={entity} onRetry={onRetry} />;
  }
  if (isLoading) {
    return skeleton ?? <SkeletonList numberOfItems={3} className="h-18" />;
  }
  if (isEmpty && empty !== undefined) {
    return empty;
  }
  return children;
}

export function AdminFetchErrorState(
  props: Omit<ComponentProps<typeof DataFetchErrorState>, 'description'>,
) {
  return (
    <DataFetchErrorState {...props} description={fetchErrorDescription()} />
  );
}

function fetchErrorDescription(): string {
  return t('Your data is safe. Try again in a moment.');
}

export const adminFetchError = { description: fetchErrorDescription };

type AdminQueryStateProps = {
  isLoading: boolean;
  isError: boolean;
  hasData?: boolean;
  onRetry?: () => unknown;
  entity: string;
  isEmpty?: boolean;
  empty?: ReactNode;
  skeleton?: ReactNode;
  children: ReactNode;
};
