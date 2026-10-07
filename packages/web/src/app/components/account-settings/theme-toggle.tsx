import { t } from 'i18next';
import { ChevronsUpDown, Monitor, Moon, Sun } from 'lucide-react';

import {
  ThemePreference,
  useTheme,
} from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { SETTING_TRIGGER_CLASS, SettingRow } from './setting-row';

export const ThemeToggle = () => {
  const { preference, setPreference } = useTheme();
  const current = THEME_OPTIONS.find((option) => option.value === preference);

  return (
    <SettingRow title={t('Theme')}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label={t('Theme')}
            className={SETTING_TRIGGER_CLASS}
          >
            <span className="flex min-w-0 items-center gap-2">
              {current && <current.icon className="text-gray-11" />}
              <span className="truncate">{current?.label}</span>
            </span>
            <ChevronsUpDown className="text-gray-11" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuRadioGroup
            value={preference}
            onValueChange={(value) => {
              const next = THEME_OPTIONS.find(
                (option) => option.value === value,
              );
              if (next) {
                setPreference(next.value);
              }
            }}
          >
            {THEME_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <option.icon className="text-gray-11" />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SettingRow>
  );
};

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];
