import { t } from 'i18next';
import { Monitor, Moon, Palette, Sun } from 'lucide-react';

import { useTheme } from '@/components/providers/theme-provider';
import { Label } from '@/components/ui/label';
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
    <div className="flex flex-col gap-2">
      <Label className="gap-2">
        <Palette className="size-4 text-gray-11" />
        {t('Theme')}
      </Label>
      <Select value={preference} onValueChange={setPreference}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">
            <span className="flex items-center gap-2">
              <Sun />
              Light
            </span>
          </SelectItem>
          <SelectItem value="dark">
            <span className="flex items-center gap-2">
              <Moon />
              Dark
            </span>
          </SelectItem>
          <SelectItem value="system">
            <span className="flex items-center gap-2">
              <Monitor />
              System
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
