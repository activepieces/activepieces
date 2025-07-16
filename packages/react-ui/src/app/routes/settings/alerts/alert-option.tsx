import { t } from 'i18next';
import { Check } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

type AlertOptionsProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
  disabled: boolean;
};

const AlertOption = React.memo(
  ({
    title,
    description,
    icon,
    isActive,
    onClick,
    disabled,
  }: AlertOptionsProps) => {
    return (
      <div
        onClick={() => (disabled ? undefined : onClick())}
        role="toggle"
        className={cn(
          `-mx-2 flex items-center space-x-4 rounded-md p-2 transition-all cursor-default `,
          {
            'hover:bg-accent hover:text-accent-foreground  cursor-pointer ':
              !disabled,
            'bg-accent text-accent-foreground': isActive && !disabled,
            'opacity-50 cursor-not-allowed ': disabled,
          },
        )}
      >
        {icon}
        <div className="flex-grow space-y-1">
          <p className="text-sm font-medium leading-none">{t(title)}</p>
          <p className="text-sm text-muted-foreground">{t(description)}</p>
        </div>
        <div>
          {isActive && <Check className="mr-2 size-4 text-muted-foreground" />}
        </div>
      </div>
    );
  },
);

AlertOption.displayName = 'AlertOption';
export { AlertOption };
