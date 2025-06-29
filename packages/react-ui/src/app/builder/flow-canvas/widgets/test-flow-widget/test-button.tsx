import { t } from 'i18next';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type TestButtonProps = {
  onClick: () => void;
  text: string;
  disabled?: boolean;
  loading?: boolean;
  showKeyboardShortcut?: boolean;
};

const TestButton = ({
  onClick,
  text,
  disabled = false,
  loading = false,
  showKeyboardShortcut = true,
}: TestButtonProps) => {
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
          variant="ghost"
          className="h-8 !bg-primary-100/80 text-primary-300 disabled:pointer-events-auto hover:!border-primary hover:!text-primary-300 border-primary/50 border border-solid rounded-full animate-fade"
          disabled={disabled}
          loading={loading}
          onClick={onClick}
        >
          <div className="flex justify-center items-center gap-2">
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

TestButton.displayName = 'TestButton';

export { TestButton };
