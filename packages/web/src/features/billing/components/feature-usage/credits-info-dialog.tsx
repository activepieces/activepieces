import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUpRight, Coins } from 'lucide-react';
import React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

export const CreditsInfoDialog = () => {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const faqs = buildFaqs(edition === ApEdition.CLOUD);
  return (
    <Dialog>
      <DialogTrigger className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline">
        {t('Usage breakdown')}
        <ArrowUpRight className="size-3.5" />
      </DialogTrigger>
      <DialogContent
        showCloseButton
        aria-describedby={undefined}
        className="max-w-[625px] gap-0 overflow-hidden p-0"
      >
        <div className="relative flex shrink-0 flex-col items-center justify-center gap-2 overflow-hidden border-b bg-violet-50 px-6 py-12 dark:bg-violet-950/30">
          <DialogTitle className="relative flex items-center gap-2 text-2xl font-bold text-purple-900 dark:text-purple-200">
            <Coins className="size-6" />
            {t('Credits FAQ')}
          </DialogTitle>
        </div>
        <ScrollArea className="max-h-[65vh]" showGradient>
          <Accordion
            type="single"
            collapsible
            defaultValue="0"
            className="border-0 px-6 py-2"
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={String(index)}
                className="border-b last:border-b-0"
              >
                <AccordionTrigger className="px-0 py-4 text-base text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-4 text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

function CreditsCostTable({
  includeActivepiecesModels,
}: {
  includeActivepiecesModels: boolean;
}) {
  const items = buildCostItems(includeActivepiecesModels);
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[10px] border">
      <div className="flex items-center gap-2 border-b px-3 py-2.5 text-sm font-medium text-muted-foreground">
        <span className="flex-1">{t('Action')}</span>
        <span className="w-40 text-right">{t('Credits')}</span>
      </div>
      {items.map((item, index) => {
        const border = index < items.length - 1 ? 'border-b' : '';
        if (item.kind === 'section') {
          return (
            <div
              key={item.label}
              className={cn(
                'bg-muted px-2 py-1.5 text-center text-xs font-semibold uppercase text-muted-foreground',
                border,
              )}
            >
              {item.label}
            </div>
          );
        }
        return (
          <div
            key={item.action}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm text-foreground',
              border,
            )}
          >
            <div className="flex flex-1 flex-col">
              <span>{item.action}</span>
              {item.sub && (
                <span className="text-xs text-muted-foreground">
                  {item.sub}
                </span>
              )}
            </div>
            <span className="w-40 shrink-0 text-right">{item.credits}</span>
          </div>
        );
      })}
    </div>
  );
}

function buildCostItems(includeActivepiecesModels: boolean): CostItem[] {
  const modelByActivepieces = t('Model by Activepieces');
  const execution: CostItem[] = [
    { kind: 'section', label: t('Execution') },
    { kind: 'row', action: t('Flow run'), credits: '1' },
    {
      kind: 'row',
      action: t('Standard step'),
      sub: t('Any built-in or 3rd-party app step — Slack, GSheets, ..etc'),
      credits: '0',
    },
    {
      kind: 'row',
      action: t('Tool use'),
      sub: t(
        'An action triggered by an Agent or Chat, not run directly in the flow',
      ),
      credits: '1',
    },
    {
      kind: 'row',
      action: t('AI step'),
      sub: t('Activepieces AI — non 3rd-party ai i.e OpenAI'),
      credits: t('see below'),
    },
    {
      kind: 'row',
      action: t('Agent/Chat'),
      sub: t('sum of tools use + model cost per message'),
      credits: t('see below'),
    },
  ];
  const activepiecesModels: CostItem[] = includeActivepiecesModels
    ? [
        { kind: 'row', action: t('Fast'), sub: modelByActivepieces, credits: '2' },
        {
          kind: 'row',
          action: t('Smart'),
          sub: modelByActivepieces,
          credits: '10',
        },
        {
          kind: 'row',
          action: t('Premium'),
          sub: modelByActivepieces,
          credits: '20',
        },
      ]
    : [];
  const ai: CostItem[] = [
    { kind: 'section', label: t('AI Steps (per call)') },
    ...activepiecesModels,
    {
      kind: 'row',
      action: t('BYOK'),
      sub: t('Bring Your Own Key — flat execution cost, no model markup'),
      credits: '1',
    },
  ];
  return [...execution, ...ai];
}

function buildFaqs(isCloud: boolean): Faq[] {
  return [
    {
      question: t('What are credits?'),
      answer: t(
        'Credits are the unit used to measure your usage on Activepieces. Every action you run consumes a certain number of credits depending on what it does.',
      ),
    },
    {
      question: t('How are credits consumed?'),
      answer: (
        <div className="flex flex-col gap-2.5">
          <span>
            {t(
              "Each action in Activepieces has a fixed credit cost. Here's a breakdown:",
            )}
          </span>
          <CreditsCostTable includeActivepiecesModels={isCloud} />
        </div>
      ),
    },
    {
      question: t('What is BYOK?'),
      answer: t(
        'BYOK stands for Bring Your Own Key. You connect your own AI provider API key, and Activepieces charges only 1 credit per call instead of the full model cost.',
      ),
    },
    {
      question: t('Do unused credits carry over?'),
      answer: t(
        'No. Credits reset at the start of each billing cycle. Any unused credits from the previous month are not carried over.',
      ),
    },
    {
      question: t('Can I get more credits?'),
      answer: t(
        'Yes. You can upgrade your plan to get more monthly credits, or enable auto recharge to automatically add credits when your balance runs low.',
      ),
    },
    {
      question: t('What happens when I run out of credits?'),
      answer: t(
        'Your flows will stop running until your credits are renewed at the start of the next billing cycle. You can enable auto recharge to automatically top up your credits before they run out.',
      ),
    },
    {
      question: t('How can I bring my own AI key?'),
      answer: t(
        "Go to Settings → AI Providers, add your API key from any supported provider, and select it when building your flows. You'll be charged only 1 credit per AI call instead of the full model cost.",
      ),
    },
  ];
}

type CostItem =
  | { kind: 'section'; label: string }
  | { kind: 'row'; action: string; sub?: string; credits: string };

type Faq = {
  question: string;
  answer: React.ReactNode;
};
