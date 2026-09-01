import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function SelectedOnlyButton({
  pressed,
  onToggle,
}: {
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onToggle}
      className="gap-2"
    >
      <Checkbox checked={pressed} className="pointer-events-none" />
      {t('Selected only')}
    </Button>
  );
}
