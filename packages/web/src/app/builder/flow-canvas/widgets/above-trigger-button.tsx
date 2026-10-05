import { t } from 'i18next';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { isEditableTarget, isMac } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

type AboveTriggerButtonProps = {
  onClick: () => void;
  text: string;
  disable?: boolean;
  loading?: boolean;
  showKeyboardShortcut?: boolean;
  shortCutIsEscape?: boolean;
  showPrimaryBg?: boolean;
};

const AboveTriggerButton = ({
  onClick,
  text,
  disable = false,
  loading = false,
  showKeyboardShortcut = true,
  shortCutIsEscape = false,
  showPrimaryBg = true,
}: AboveTriggerButtonProps) => {
  const isMacSystem = isMac();

  useEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }
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
        if (!loading && !disable) {
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
        <div className="bg-gray-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'animate-fade border border-solid border-gray-6 bg-gray-1',
              {
                'bg-accent-3! text-accent-11 hover:text-accent-11 disabled:pointer-events-auto hover:border-accent-9!  border-accent-7':
                  showPrimaryBg,
              },
            )}
            loading={loading}
            disabled={disable}
            onClick={onClick}
          >
            <div className="flex justify-center items-center gap-2">
              {text}
              {showKeyboardShortcut && (
                <span
                  className={cn(
                    'flex h-5 items-center justify-center whitespace-nowrap rounded-md bg-gray-3 px-1 text-xs text-gray-11',
                    {
                      'bg-accent-5 text-accent-11': showPrimaryBg,
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
      {disable && (
        <TooltipContent side="bottom">
          {t('Please test the trigger first')}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

AboveTriggerButton.displayName = 'AboveTriggerButton';

export { AboveTriggerButton };
