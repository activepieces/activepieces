import { t } from 'i18next';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlayCircle } from 'lucide-react';

type TestButtonWithTooltipProps = {
  onClick: () => void;
  text: string;
  disabled?: boolean;
  loading?: boolean;
  showKeyboardShortcut?: boolean;
};

const TestButtonWithTooltip = ({
  onClick,
  text,
  disabled = false,
  loading = false,
  showKeyboardShortcut = true,
}: TestButtonWithTooltipProps) => {
  const isMac = /(Mac)/i.test(navigator.userAgent);

  useEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      if (
        (isMac && event.metaKey && event.key.toLocaleLowerCase() === 'd') ||
        (!isMac && event.ctrlKey && event.key.toLocaleLowerCase() === 'd')
      ) {
        event.preventDefault();
        event.stopPropagation();

        if (!loading && !disabled) {
          onClick();
        }
      }
    };

    window.addEventListener('keydown', keydownHandler, { capture: true });

    return () => {
      window.removeEventListener('keydown', keydownHandler, { capture: true });
    };
  }, [isMac, loading, disabled, onClick]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          className="h-8 text-primary-300 disabled:pointer-events-auto hover:!border-primary hover:!text-primary-300 hover:!bg-transparent border-primary/50 border border-solid animate-fade"
          disabled={disabled}
          loading={loading}
          onClick={onClick}
        >
          <div className="flex justify-center items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            {text}
            {showKeyboardShortcut && (
              <span className="text-[10px] tracking-widest whitespace-nowrap">
                {isMac ? '⌘ + D' : 'Ctrl + D'}
              </span>
            )}
          </div>
        </Button>
      </TooltipTrigger>
      {disabled && (
        <TooltipContent side="bottom">
          {t('Please test the trigger first')}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

TestButtonWithTooltip.displayName = 'TestButtonWithTooltip';

export { TestButtonWithTooltip };
