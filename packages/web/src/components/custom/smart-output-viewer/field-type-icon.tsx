import { isNil } from '@activepieces/shared';
import {
  AlignLeft,
  AtSign,
  Braces,
  Calendar,
  CircleHelp,
  Clock,
  DollarSign,
  FileCode,
  Hash,
  HardDrive,
  Link2,
  List,
  ToggleLeft,
} from 'lucide-react';

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
  const iconClass = cn(
    'h-3.5 w-3.5 shrink-0 text-muted-foreground/60',
    className,
  );

  if (format === 'email') return <AtSign className={iconClass} />;
  if (format === 'url') return <Link2 className={iconClass} />;
  if (format === 'date' || format === 'datetime')
    return <Calendar className={iconClass} />;
  if (format === 'html') return <FileCode className={iconClass} />;
  if (format === 'currency') return <DollarSign className={iconClass} />;
  if (format === 'filesize') return <HardDrive className={iconClass} />;
  if (format === 'duration') return <Clock className={iconClass} />;
  if (format === 'boolean') return <ToggleLeft className={iconClass} />;

  if (isNil(value)) return <CircleHelp className={iconClass} />;
  if (Array.isArray(value)) return <List className={iconClass} />;
  if (typeof value === 'object') return <Braces className={iconClass} />;
  if (typeof value === 'boolean') return <ToggleLeft className={iconClass} />;
  if (typeof value === 'number') return <Hash className={iconClass} />;

  const str = String(value);
  if (/^https?:\/\//i.test(str)) return <Link2 className={iconClass} />;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str))
    return <AtSign className={iconClass} />;
  if (!isNaN(Date.parse(str)) && /^\d{4}-\d{2}-\d{2}/.test(str))
    return <Calendar className={iconClass} />;

  return <AlignLeft className={iconClass} />;
}

export { FieldTypeIcon };
