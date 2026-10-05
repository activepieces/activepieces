import { t } from 'i18next';
import { Monitor, Moon, Sun } from 'lucide-react';

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
            <Sun />
            {t('Light')}
          </SelectItem>
          <SelectItem value="dark">
            <Moon />
            {t('Dark')}
          </SelectItem>
          <SelectItem value="system">
            <Monitor />
            {t('System')}
          </SelectItem>
        </SelectContent>
      </Select>
    </SettingRow>
  );
};
