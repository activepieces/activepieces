import { t } from 'i18next';

import { SettingRow } from '@/components/custom/panel';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { userHooks } from '@/hooks/user-hooks';

export const PlatformOwnerRow = ({ ownerId }: PlatformOwnerRowProps) => {
  const { data: owner } = userHooks.useUserById(ownerId);
  const name = owner
    ? [owner.firstName, owner.lastName].filter(Boolean).join(' ')
    : '';

  return (
    <SettingRow
      title={t('Platform owner')}
      description={t('Billing and legal notices go to this person.')}
    >
      {owner ? (
        <div className="flex min-w-0 flex-col items-end">
          <span className="text-sm font-medium text-gray-12">
            {name || owner.email}
          </span>
          {name && (
            <TextWithTooltip tooltipMessage={owner.email}>
              <span className="max-w-56 truncate text-xs text-gray-11">
                {owner.email}
              </span>
            </TextWithTooltip>
          )}
        </div>
      ) : (
        <span className="text-sm text-gray-11">—</span>
      )}
    </SettingRow>
  );
};

type PlatformOwnerRowProps = {
  ownerId: string;
};
