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

  const clampsItsOwnLines = /\bline-clamp-\d+\b/.test(
    children.props.className ?? '',
  );

  const checkTruncation = useCallback(() => {
    const element = textRef.current;
    if (!element) {
      return;
    }
    setIsTruncated(
      clampsItsOwnLines
        ? element.scrollHeight > element.clientHeight
        : element.scrollWidth > element.clientWidth,
    );
  }, [clampsItsOwnLines]);

  useEffect(() => {
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [checkTruncation]);

  const childWithRef = React.cloneElement(children, {
    ref: textRef,
    className: cn(
      clampsItsOwnLines ? undefined : 'truncate',
      children.props.className,
    ),
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
