import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { Avatar, AvatarFallback } from './avatar';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

const avatarLetterVariants = cva('l', {
  variants: {
    size: {
      sm: 'w-4 h-4 rounded-full',
      md: 'w-5 h-5 rounded-full',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
type AvatarLetterProps = VariantProps<typeof avatarLetterVariants> & {
  name: string;
  email: string;
  className?: string;
  disablePopup?: boolean;
};

const AvatarLetter = ({
  name,
  email,
  className,
  size,
  disablePopup,
}: AvatarLetterProps) => (
  <Avatar className={cn(className, avatarLetterVariants({ size }))}>
    <AvatarFallback>
      {!disablePopup && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="text-xs text-background">
                {email.charAt(0).toLocaleUpperCase()}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span className="text-xs">
              {name} <br />({email})
            </span>
          </TooltipContent>
        </Tooltip>
      )}
      {disablePopup && (
        <span className="text-xs text-background">
          {email.charAt(0).toLocaleUpperCase()}
        </span>
      )}
    </AvatarFallback>
  </Avatar>
);
export { AvatarLetter };
