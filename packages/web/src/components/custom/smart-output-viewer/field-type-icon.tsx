import { isNil } from '@activepieces/core-utils';
import {
  AtIcon,
  BracesIcon,
  Calendar03Icon,
  Clock01Icon,
  Dollar01Icon,
  FileCodeIcon,
  HardDriveIcon,
  HashIcon,
  HelpCircleIcon,
  Image01Icon,
  LeftToRightListBulletIcon,
  Link02Icon,
  TextAlignLeftIcon,
  ToggleOffIcon,
} from '@hugeicons/core-free-icons';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { cn } from '@/lib/utils';

import { FieldFormat } from './types';

function FieldTypeIcon({
  value,
  format,
  className,
}: {
  value?: unknown;
  format?: FieldFormat;
  className?: string;
}) {
  const iconClass = cn('h-3.5 w-3.5 shrink-0 text-gray-11', className);

  if (format === 'email')
    return <HugeiconsIcon icon={AtIcon} className={iconClass} />;
  if (format === 'url')
    return <HugeiconsIcon icon={Link02Icon} className={iconClass} />;
  if (format === 'image')
    return <HugeiconsIcon icon={Image01Icon} className={iconClass} />;
  if (format === 'date' || format === 'datetime')
    return <HugeiconsIcon icon={Calendar03Icon} className={iconClass} />;
  if (format === 'html')
    return <HugeiconsIcon icon={FileCodeIcon} className={iconClass} />;
  if (format === 'currency')
    return <HugeiconsIcon icon={Dollar01Icon} className={iconClass} />;
  if (format === 'filesize')
    return <HugeiconsIcon icon={HardDriveIcon} className={iconClass} />;
  if (format === 'duration')
    return <HugeiconsIcon icon={Clock01Icon} className={iconClass} />;
  if (format === 'boolean')
    return <HugeiconsIcon icon={ToggleOffIcon} className={iconClass} />;
  if (format === 'number')
    return <HugeiconsIcon icon={HashIcon} className={iconClass} />;

  if (isNil(value))
    return <HugeiconsIcon icon={HelpCircleIcon} className={iconClass} />;
  if (Array.isArray(value))
    return (
      <HugeiconsIcon icon={LeftToRightListBulletIcon} className={iconClass} />
    );
  if (typeof value === 'object')
    return <HugeiconsIcon icon={BracesIcon} className={iconClass} />;
  if (typeof value === 'boolean')
    return <HugeiconsIcon icon={ToggleOffIcon} className={iconClass} />;
  if (typeof value === 'number')
    return <HugeiconsIcon icon={HashIcon} className={iconClass} />;

  const str = String(value);
  if (/^https?:\/\//i.test(str))
    return <HugeiconsIcon icon={Link02Icon} className={iconClass} />;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str))
    return <HugeiconsIcon icon={AtIcon} className={iconClass} />;
  if (!isNaN(Date.parse(str)) && /^\d{4}-\d{2}-\d{2}/.test(str))
    return <HugeiconsIcon icon={Calendar03Icon} className={iconClass} />;

  return <HugeiconsIcon icon={TextAlignLeftIcon} className={iconClass} />;
}

export { FieldTypeIcon };
