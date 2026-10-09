import { HelpCircle } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getGlossaryTerm } from '@/lib/synkra-glossary';
import { cn } from '@/lib/utils';

type SynkraInfoTipProps = {
  term: string;
  className?: string;
};

/**
 * Small information icon that shows a plain English explanation on hover.
 * The explanation comes from the shared glossary so it stays consistent
 * with the public glossary page when we add it.
 */
export function SynkraInfoTip({ term, className }: SynkraInfoTipProps) {
  const entry = getGlossaryTerm(term);
  if (!entry) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`What is a ${entry.term}?`}
          className={cn(
            'inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-9 hover:text-gray-11 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary',
            className,
          )}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="flex flex-col gap-1.5">
          <div className="font-medium">{entry.term}</div>
          <div className="text-xs leading-relaxed">{entry.short}</div>
          <Link
            to="/glossary"
            className="text-[11px] text-primary hover:underline"
          >
            See full glossary
          </Link>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
