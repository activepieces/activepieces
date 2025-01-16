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
  shouldNotPreventDefault?: boolean;
};

export const Shortcut = ({
  shortcutKey,
  withCtrl,
  withShift,
  className,
}: ShortcutProps & { className?: string }) => {
  const isMac = /(Mac)/i.test(navigator.userAgent);
  const isEscape = shortcutKey?.toLocaleLowerCase() === 'esc';
  return (
    <span
      className={cn(
        'flex-grow text-xs tracking-widest text-muted-foreground',
        className,
      )}
    >
      {!isEscape && withCtrl && (isMac ? '⌘' : 'Ctrl')}
      {!isEscape && withShift && 'Shift'}
      {!isEscape && (withCtrl || withShift) && ' + '}
      {shortcutKey && toTitleCase(shortcutKey)}
    </span>
  );
};
