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
  triggerHasNoSampleData?: boolean;
  loading?: boolean;
  showKeyboardShortcut?: boolean;
};

const TestButton = ({
  onClick,
  text,
  triggerHasNoSampleData = false,
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
            className="h-8 bg-primary-100/50! dark:text-primary-foreground  text-primary hover:text-primary disabled:pointer-events-auto hover:border-primary!  border-primary/50 border border-solid rounded-lg animate-fade"
            loading={loading}
            disabled={triggerHasNoSampleData}
            onClick={onClick}
          >
            <div className="flex justify-center items-center gap-2">
              {text}
              {showKeyboardShortcut && (
                <span className="text-[10px] bg-primary/13 h-[20px] flex items-center justify-center px-1 rounded-sm tracking-widest whitespace-nowrap">
                  {isMac ? '⌘ + D' : 'Ctrl + D'}
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

TestButton.displayName = 'TestButton';

export { TestButton };
