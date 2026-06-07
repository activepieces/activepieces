import { t } from 'i18next';
import { Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

export function EmptyState({
  onSuggestionClick,
  incognito,
  showFlowCards,
  hasInput,
}: {
  onSuggestionClick: (text: string) => void;
  incognito: boolean;
  showFlowCards: boolean;
  hasInput: boolean;
}) {
  const { data: currentUser } = userHooks.useCurrentUser();
  const firstName = currentUser?.firstName ?? '';

  return (
    <div className="pt-8 pb-6">
      <div className="max-w-3xl mx-auto px-6">
        <Greeting firstName={firstName} incognito={incognito} />
      </div>
      {!incognito && (
        <div
          className={cn(
            'grid transition-all duration-300 ease-out',
            hasInput
              ? 'grid-rows-[0fr] opacity-0'
              : 'grid-rows-[1fr] opacity-100',
          )}
        >
          <div className="overflow-hidden">
            {showFlowCards && (
              <FlowCards onSuggestionClick={onSuggestionClick} />
            )}
            <div className="max-w-3xl mx-auto px-6">
              <Separator className="my-6" />
              <TextSuggestions onSuggestionClick={onSuggestionClick} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SetupRequiredState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20 flex-1 min-w-0">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted">
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          {t('Set up an AI provider to get started')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {t(
            'AI Chat requires an AI provider. Add your provider in the AI settings to start chatting.',
          )}
        </p>
      </div>
      <Button onClick={() => navigate('/platform/setup/ai')} className="gap-2">
        <Settings className="h-4 w-4" />
        {t('Go to AI Settings')}
      </Button>
    </div>
  );
}

export function MessageSkeletons() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 py-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function Greeting({
  firstName,
  incognito,
}: {
  firstName: string;
  incognito: boolean;
}) {
  return (
    <motion.div
      className="flex flex-col items-start gap-3.5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-4xl font-bold leading-tight text-balance font-sentient">
        {incognito ? (
          t('Private Chat')
        ) : firstName ? (
          <>
            {t("Let's get")}
            <br />
            {t('unbusy, {name}?', { name: firstName })} 👋
          </>
        ) : (
          <>{t("Let's get unbusy?")} 👋</>
        )}
      </h1>
      {!incognito && (
        <p className="text-base text-muted-foreground">
          {t('I can do all your work, just name it!')}
        </p>
      )}
    </motion.div>
  );
}

function FlowCards({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <div
      className="mt-6 flex gap-4 overflow-x-auto scrollbar-none pb-1"
      style={{
        paddingLeft: 'max(1.5rem, calc((100% - 48rem) / 2 + 1.5rem))',
        paddingRight: 'max(1.5rem, calc((100% - 48rem) / 2 + 1.5rem))',
      }}
    >
      {FLOW_CARDS.map((card, i) => (
        <motion.button
          key={card.title}
          type="button"
          className={cn(
            'shrink-0 text-left cursor-pointer group',
            card.wide ? 'w-[380px]' : 'w-[245px]',
          )}
          onClick={() => onSuggestionClick(card.description)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
        >
          <div
            className={cn(
              'h-[245px] rounded-xl overflow-hidden relative',
              !card.wide && 'aspect-square',
            )}
          >
            <img
              src={card.bgImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <img
              src={card.image}
              alt={card.title}
              loading="lazy"
              className="absolute inset-0 m-auto w-[79%] h-[69%] object-contain transition-transform duration-300 ease-out group-hover:scale-105"
            />
          </div>
          <h3 className="mt-3 text-sm font-semibold group-hover:text-primary transition-colors">
            {t(card.title)}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {t(card.description)}
          </p>
        </motion.button>
      ))}
    </div>
  );
}

function TextSuggestions({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {TEXT_SUGGESTIONS.map((suggestion, i) => (
        <motion.button
          key={suggestion.title}
          type="button"
          className="flex items-center gap-4 rounded-xl p-2 text-left hover:bg-accent transition-colors cursor-pointer"
          onClick={() => onSuggestionClick(suggestion.description)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
        >
          <div className="w-24 h-16 shrink-0 rounded-xl bg-muted flex items-center justify-center p-2.5">
            <img
              src={suggestion.icon}
              alt=""
              loading="lazy"
              className={cn(
                'max-w-full max-h-full object-contain',
                suggestion.darkIcon && 'dark:hidden',
              )}
            />
            {suggestion.darkIcon && (
              <img
                src={suggestion.darkIcon}
                alt=""
                loading="lazy"
                className="max-w-full max-h-full object-contain hidden dark:block"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium">{t(suggestion.title)}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {t(suggestion.description)}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

const FLOW_CARDS: FlowCardData[] = [
  {
    title: 'Cleanup Spam Emails',
    description:
      'Find all promotional emails from last week and move them to spam',
    image: '/chat-suggestions/card-cleanup-spam.svg',
    bgImage: '/chat-suggestions/card-background-1.svg',
  },
  {
    title: 'Lead Enrichment',
    description: 'Enrich all leads in this sheet with person and company info',
    image: '/chat-suggestions/card-lead-enrichment.svg',
    bgImage: '/chat-suggestions/card-background-2.svg',
  },
  {
    title: 'Triage Support Tickets',
    description:
      'Classify incoming emails to a shared inbox and forward each to the right person',
    image: '/chat-suggestions/card-triage-support.svg',
    bgImage: '/chat-suggestions/card-background-3.svg',
    wide: true,
  },
];

const TEXT_SUGGESTIONS: TextSuggestionData[] = [
  {
    icon: '/chat-suggestions/icon-route-emails.svg',
    title: 'Route Incoming Emails',
    description:
      'Classify every incoming email by topic and automatically route it to the right person or team.',
  },
  {
    icon: '/chat-suggestions/icon-sync-contacts.svg',
    title: 'Sync Sheet Contacts',
    description:
      'Take every row in this spreadsheet and add it as a new contact inside your CRM automatically.',
  },
  {
    icon: '/chat-suggestions/icon-plan-crm.svg',
    title: 'Plan CRM Tasks',
    description:
      "Check your CRM deals, find today's top priorities, and build a clear task list for your day.",
  },
  {
    icon: '/chat-suggestions/icon-summarize-emails.svg',
    darkIcon: '/chat-suggestions/icon-summarize-emails-dark.svg',
    title: 'Summarize Daily Emails',
    description:
      "Scan today's inbox, find the emails you haven't replied to yet, and flag them all for you.",
  },
  {
    icon: '/chat-suggestions/icon-slack-bot.svg',
    title: 'Build a Slack Bot',
    description:
      "Answer your team's questions on Slack instantly using your company's internal knowledge base.",
  },
  {
    icon: '/chat-suggestions/icon-screen-candidates.svg',
    darkIcon: '/chat-suggestions/icon-screen-candidates-dark.svg',
    title: 'Screen Job Candidates',
    description:
      'Read every candidate in this sheet, score them on the filled info, and write the score back in.',
  },
  {
    icon: '/chat-suggestions/icon-lead-enrichment.svg',
    title: 'Lead Enrichment',
    description:
      'Take every lead in this sheet and enrich it with full person and company info automatically.',
  },
  {
    icon: '/chat-suggestions/icon-cleanup-spam.svg',
    darkIcon: '/chat-suggestions/icon-cleanup-spam-dark.svg',
    title: 'Cleanup Spam Emails',
    description:
      'Find all promotional emails from the last week and move every one of them straight to spam.',
  },
  {
    icon: '/chat-suggestions/icon-triage-support.svg',
    title: 'Triage Support Tickets',
    description:
      "Read your open tickets, classify each by type and urgency, then tag them so the team knows what's first.",
  },
];

type FlowCardData = {
  title: string;
  description: string;
  image: string;
  bgImage: string;
  wide?: boolean;
};

type TextSuggestionData = {
  icon: string;
  darkIcon?: string;
  title: string;
  description: string;
};
