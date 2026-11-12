import { isMac } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
export type ShortcutProps = {
  //can't name it key because it conflicts with the key prop of the component
  shortcutKey: string;
  withCtrl?: boolean;
  withShift?: boolean;
};

export const Shortcut = ({
  shortcutKey,
  withCtrl,
  withShift,
  variant = 'default',
  className,
}: ShortcutProps & {
  className?: string;
  variant?: 'default' | 'compact';
}) => {
  if (variant === 'compact') {
    return (
      <kbd className={cn('font-sans text-xs text-gray-11', className)}>
        {compactShortcut({ shortcutKey, withCtrl, withShift })}
      </kbd>
    );
  }
  const isEscape = shortcutKey?.toLocaleLowerCase() === 'esc';
  return (
    <span
      className={cn('grow text-xs tracking-widest text-gray-11', className)}
    >
      {!isEscape && withCtrl && (isMac() ? '⌘' : 'Ctrl')}
      {!isEscape && withShift && 'Shift'}
      {!isEscape && (withCtrl || withShift) && ' + '}
      {shortcutKey && toTitleCase(shortcutKey)}
    </span>
  );
};

export const compactShortcut = ({
  shortcutKey,
  withCtrl = false,
  withShift = false,
}: ShortcutProps): string => {
  if (!withCtrl) return shortcutKey;
  if (isMac()) return `${withShift ? '⇧' : ''}⌘${shortcutKey}`;
  return `Ctrl ${withShift ? 'Shift ' : ''}${shortcutKey}`;
};
