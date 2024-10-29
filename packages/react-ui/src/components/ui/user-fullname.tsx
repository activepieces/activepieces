import { User } from 'lucide-react';
import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

type UserFullNameProps = {
  firstName: string;
  lastName: string;
  email: string;
  className?: string;
};

const UserFullName: React.FC<UserFullNameProps> = ({
  firstName,
  lastName,
  email,
  className,
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <User className="mr-2" size={16} />
      <Tooltip>
        <TooltipTrigger>
          <span className="text-sm font-medium">
            {firstName} {lastName}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <span className="text-xs">{email}</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export { UserFullName };
