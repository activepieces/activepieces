import { t } from 'i18next';
import { Monitor, Moon, Palette, Sun } from 'lucide-react';

import { useTheme } from '@/components/theme-provider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Palette className="w-4 h-4" />
        {t('Theme')}
      </Label>
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light" className="text-sm py-2">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Light
            </div>
          </SelectItem>
          <SelectItem value="dark" className="text-sm py-2">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              Dark
            </div>
          </SelectItem>
          <SelectItem value="system" className="text-sm py-2">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              System
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ThemeToggle;
