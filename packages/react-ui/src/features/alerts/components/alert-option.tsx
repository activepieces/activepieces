import React from 'react';

type AlertOptionsProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
};

const AlertOption = React.memo(
  ({ title, description, icon, isActive, onClick }: AlertOptionsProps) => {
    return (
      <div
        onClick={onClick}
        className={`-mx-2 flex  cursor-pointer items-center space-x-4 rounded-md p-2 transition-all ${
          isActive ? 'bg-accent text-accent-foreground' : ''
        }`}
      >
        {icon}
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }
);

AlertOption.displayName = 'AlertOption';
export { AlertOption };
