import { t } from 'i18next';
import { ListChecks } from 'lucide-react';

import { Toggle } from '@/components/ui/toggle';

export function SelectedOnlyButton({
  pressed,
  onToggle,
}: {
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <Toggle
      variant="outline"
      pressed={pressed}
      onPressedChange={onToggle}
      className="px-3 text-gray-12 data-[state=on]:border-gray-8"
    >
      <ListChecks className="text-gray-11" />
      {t('Selected only')}
    </Toggle>
  );
}
