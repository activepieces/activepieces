import { t } from 'i18next';

import { Checkbox } from '@/components/ui/checkbox';

export function SelectedOnlyButton({
  pressed,
  onToggle,
}: {
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-gray-6 bg-gray-1 px-3 text-sm text-gray-12 transition-colors hover:bg-gray-4">
      <Checkbox checked={pressed} onCheckedChange={onToggle} />
      {t('Selected only')}
    </label>
  );
}
