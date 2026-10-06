import {
  ComputerIcon,
  Moon02Icon,
  Sun03Icon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { SettingRow } from '@/components/custom/panel';
import { useTheme } from '@/components/providers/theme-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ThemeToggle = () => {
  const { preference, setPreference } = useTheme();

  return (
    <SettingRow
      title={t('Theme')}
      description={t('Choose light, dark, or match your system')}
    >
      <Select value={preference} onValueChange={setPreference}>
        <SelectTrigger size="sm" className="w-40" aria-label={t('Theme')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="light">
            <HugeiconsIcon icon={Sun03Icon} />
            {t('Light')}
          </SelectItem>
          <SelectItem value="dark">
            <HugeiconsIcon icon={Moon02Icon} />
            {t('Dark')}
          </SelectItem>
          <SelectItem value="system">
            <HugeiconsIcon icon={ComputerIcon} />
            {t('System')}
          </SelectItem>
        </SelectContent>
      </Select>
    </SettingRow>
  );
};
