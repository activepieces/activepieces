import { AppConnectionStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

import { SearchInput } from '@/components/custom/search-input';
import { StatusDot } from '@/components/custom/status-dot';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { NameCell } from '@/components/custom/list/list-cells';

export function ConnectionNameCell({
  pieceName,
  displayName,
}: {
  pieceName: string;
  displayName: string;
}) {
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName });
  return (
    <NameCell
      media={
        <PieceIcon
          size="xs"
          border={true}
          displayName={summary?.displayName}
          logoUrl={summary?.logoUrl}
          showTooltip={false}
        />
      }
      title={displayName}
      sub={summary?.displayName}
    />
  );
}

export function ConnectionStatus({ status }: { status: AppConnectionStatus }) {
  return (
    <StatusDot tone={CONNECTION_STATUS_TONE[status]}>
      {connectionStatusLabel(status)}
    </StatusDot>
  );
}

export function ParamSearchInput({
  paramKey,
  placeholder,
}: {
  paramKey: string;
  placeholder: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramKey) ?? '');
  const writeParam = useDebouncedCallback((next: string) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next.trim().length === 0) {
          params.delete(paramKey);
        } else {
          params.set(paramKey, next);
        }
        params.delete('cursor');
        return params;
      },
      { replace: true }
    );
  }, 300);
  return (
    <SearchInput
      value={value}
      placeholder={placeholder}
      onChange={(next) => {
        setValue(next);
        writeParam(next);
      }}
    />
  );
}

export function connectionStatusLabel(status: AppConnectionStatus): string {
  switch (status) {
    case AppConnectionStatus.ACTIVE:
      return t('Active');
    case AppConnectionStatus.MISSING:
      return t('Missing');
    case AppConnectionStatus.ERROR:
      return t('Error');
  }
}

const CONNECTION_STATUS_TONE: Record<
  AppConnectionStatus,
  'success' | 'warning' | 'danger'
> = {
  [AppConnectionStatus.ACTIVE]: 'success',
  [AppConnectionStatus.MISSING]: 'warning',
  [AppConnectionStatus.ERROR]: 'danger',
};
