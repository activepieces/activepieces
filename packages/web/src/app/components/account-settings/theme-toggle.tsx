import {
  ComputerIcon,
  Moon02Icon,
  PaletteIcon,
  Sun03Icon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <HugeiconsIcon icon={PaletteIcon} className="w-4 h-4" />
        {t('Theme')}
      </Label>
      <Select value={preference} onValueChange={setPreference}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light" className="text-sm py-2">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Sun03Icon} className="w-4 h-4" />
              Light
            </div>
          </SelectItem>
          <SelectItem value="dark" className="text-sm py-2">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Moon02Icon} className="w-4 h-4" />
              Dark
            </div>
          </SelectItem>
          <SelectItem value="system" className="text-sm py-2">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={ComputerIcon} className="w-4 h-4" />
              System
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
