import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AddItemButton({
  onClick,
  disabled = false,
  size = 'default',
}: AddItemButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size === 'thin' ? 'xs' : 'default'}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full border-dashed border-gray-7 bg-transparent font-medium text-gray-12',
        'enabled:hover:border-solid enabled:hover:border-gray-8 enabled:hover:bg-gray-3',
        'focus-visible:border-solid',
      )}
    >
      <Plus aria-hidden="true" />
      {t('Add Item')}
    </Button>
  );
}

export type AddItemButtonSize = 'default' | 'thin';

export type AddItemButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  size?: AddItemButtonSize;
};
