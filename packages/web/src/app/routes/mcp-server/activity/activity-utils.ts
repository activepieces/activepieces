import { PopulatedMcpActivity } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';

import { formatUtils } from '@/lib/format-utils';

function formatWhen(created: string): string {
  const at = dayjs(created);
  const clock = at.format('HH:mm');
  if (at.isSame(dayjs(), 'day')) {
    return `${t('Today')} · ${clock}`;
  }
  if (at.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return `${t('Yesterday')} · ${clock}`;
  }
  return `${at.format('MMM D')} · ${clock}`;
}

function formatRan({
  row,
  actionDisplayName,
  pieceDisplayName,
}: FormatRanParams): Ran {
  return {
    action:
      actionDisplayName ??
      (row.actionName === null
        ? t('Unknown action')
        : formatUtils.convertEnumToHumanReadable(row.actionName)),
    piece: pieceDisplayName ?? row.pieceName,
  };
}

function formatAccount(row: PopulatedMcpActivity): string | null {
  return row.connectionDisplayName ?? row.connectionExternalId;
}

export const activityUtils = { formatWhen, formatRan, formatAccount };

export type Ran = {
  action: string;
  piece: string | null;
};

type FormatRanParams = {
  row: PopulatedMcpActivity;
  actionDisplayName: string | undefined;
  pieceDisplayName: string | undefined;
};
