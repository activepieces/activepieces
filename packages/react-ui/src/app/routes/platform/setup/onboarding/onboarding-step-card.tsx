import { t } from 'i18next';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type StepData = {
  step: string;
  title: string;
  description: string;
  image: string;
  bullets: string[];
  ctaLink: string;
  ctaText: string;
};

type OnboardingStepCardProps = {
  stepData: StepData;
  isCompleted: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const OnboardingStepCard = ({
  stepData,
  isCompleted,
  isOpen,
  onOpenChange,
}: OnboardingStepCardProps) => {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      className={cn('transition-all duration-200 ease-in-out w-full')}
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50 transition-colors rounded-t-md">
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full shrink-0',
              isCompleted
                ? 'bg-[#219653] text-white'
                : 'bg-[#F2F2F2] text-[#BDBDBD]',
            )}
          >
            <Check className="w-6 h-6" strokeWidth={3} />
          </div>
          <div className="flex-grow text-left">
            <h3 className={cn('text-lg font-semibold')}>{stepData.title}</h3>
            <p className="text-sm text-muted-foreground">
              {stepData.description}
            </p>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-6 pt-0 border-t mt-4 flex flex-col md:flex-row gap-8 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="w-full md:w-[70%] space-y-6">
            <ul className="space-y-4 pt-4">
              {stepData.bullets.map((bullet, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-base text-muted-foreground"
                >
                  <div className="w-2 h-2 rounded-full bg-[#BDBDBD] mt-2 shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>
            <Button>
              <Link to={stepData.ctaLink}>{stepData.ctaText}</Link>
            </Button>
          </div>
          <div className="hidden md:block md:w-[30%] shrink-0 pt-4">
            <div className="rounded-lg overflow-hidden border shadow-sm bg-muted/20 flex items-center justify-center">
              <img
                src={stepData.image}
                alt={stepData.title}
                className="max-h-[300px] object-contain"
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

OnboardingStepCard.displayName = 'OnboardingStepCard';
export { OnboardingStepCard };
