import React, { useRef, useState, useCallback, useEffect } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TextWithTooltipProps {
  tooltipMessage: string;
  children: React.ReactElement<
    React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }
  >;
}
export const TextWithTooltip = ({
  tooltipMessage,
  children,
}: TextWithTooltipProps) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = useCallback(() => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [checkTruncation]);

  const childWithRef = React.cloneElement(children, {
    ref: textRef,
    className: cn('truncate', children.props.className),
  });

  if (!isTruncated) {
    return childWithRef;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{childWithRef}</TooltipTrigger>
        <TooltipContent className="max-w-md wrap-break-word whitespace-normal">
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
