import { t } from 'i18next';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, isMac } from '@/lib/utils';

type AboveTriggerButtonProps = {
  onClick: () => void;
  text: string;
  triggerHasNoSampleData?: boolean;
  loading?: boolean;
  showKeyboardShortcut?: boolean;
  shortCutIsEscape?: boolean;
  showPrimaryBg?: boolean;
};

const AboveTriggerButton = ({
  onClick,
  text,
  triggerHasNoSampleData = false,
  loading = false,
  showKeyboardShortcut = true,
  shortCutIsEscape = false,
  showPrimaryBg = true,
}: AboveTriggerButtonProps) => {
  const isMacSystem = isMac();

  useEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      const isEscapePressed = event.key === 'Escape' && shortCutIsEscape;
      const ctrlAndDPressed =
        (isMacSystem &&
          event.metaKey &&
          event.key.toLocaleLowerCase() === 'd') ||
        (!isMacSystem &&
          event.ctrlKey &&
          event.key.toLocaleLowerCase() === 'd');
      if (isEscapePressed || ctrlAndDPressed) {
        event.preventDefault();
        event.stopPropagation();
        if (!loading && !triggerHasNoSampleData) {
          onClick();
        }
      }
    };

    window.addEventListener('keydown', keydownHandler, { capture: true });

    return () => {
      window.removeEventListener('keydown', keydownHandler, { capture: true });
    };
  }, [isMac, loading, onClick]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="bg-builder-background">
          <Button
            variant="ghost"
            className={cn(
              'h-8 bg-background border-input hover:border-border  border p-2.5 border-solid rounded-lg animate-fade',
              {
                'bg-primary-100/50! dark:text-primary-foreground  text-primary hover:text-primary disabled:pointer-events-auto hover:border-primary!  border-primary/50':
                  showPrimaryBg,
              },
            )}
            loading={loading}
            disabled={triggerHasNoSampleData}
            onClick={onClick}
          >
            <div className="flex justify-center items-center gap-2">
              {text}
              {showKeyboardShortcut && (
                <span
                  className={cn(
                    'text-[10px] bg-muted h-[20px] flex items-center justify-center px-1 rounded-sm tracking-widest whitespace-nowrap text-muted-foreground',
                    {
                      'bg-primary/13 text-primary': showPrimaryBg,
                    },
                  )}
                >
                  {shortCutIsEscape
                    ? 'Esc'
                    : isMacSystem
                    ? '⌘ + D'
                    : 'Ctrl + D'}
                </span>
              )}
            </div>
          </Button>
        </div>
      </TooltipTrigger>
      {triggerHasNoSampleData && (
        <TooltipContent side="bottom">
          {t('Please test the trigger first')}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

AboveTriggerButton.displayName = 'AboveTriggerButton';

export { AboveTriggerButton };
