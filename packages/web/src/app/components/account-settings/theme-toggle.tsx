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
  const options = themeOptions();
  const current = options.find((option) => option.value === preference);

  return (
    <SettingRow title={t('Theme')}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label={`${t('Theme')}, ${current?.label ?? ''}`}
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
              const next = options.find((option) => option.value === value);
              if (next) {
                setPreference(next.value);
              }
            }}
          >
            {options.map((option) => (
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

function themeOptions(): ThemeOption[] {
  return [
    { value: 'light', label: t('Light'), icon: Sun },
    { value: 'dark', label: t('Dark'), icon: Moon },
    { value: 'system', label: t('System'), icon: Monitor },
  ];
}

type ThemeOption = {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
};
