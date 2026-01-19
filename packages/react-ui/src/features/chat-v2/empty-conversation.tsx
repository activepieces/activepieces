import { t } from 'i18next';
import { Brain, Ticket, Github, CalendarClock } from 'lucide-react';

import quickLogoUrl from '@/assets/img/custom/quick-logo.svg';
import { Button } from '@/components/ui/button';
import { isNil } from '@activepieces/shared';

import { chatHooks } from './lib/chat-hooks';
import { useChatSessionStore } from './store';

interface Suggestion {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const suggestions: Suggestion[] = [
  {
    id: 'habit-coach',
    icon: <Brain className="size-5" />,
    title: 'Help me build a daily habit coach',
    description:
      'Send personalized coaching messages to Slack based on my Notion habit tracker',
  },
  {
    id: 'jira-tracker',
    icon: <Ticket className="size-5" />,
    title: 'Track my Jira ticket statuses',
    description:
      'Get daily Slack reports summarizing ticket counts by status for the team',
  },
  {
    id: 'github-standup',
    icon: <Github className="size-5" />,
    title: 'Summarize GitHub activity for standup',
    description:
      'Generate summaries of the last 24 hours of GitHub activity and code changes',
  },
  {
    id: 'meeting-scheduler',
    icon: <CalendarClock className="size-5" />,
    title: 'Automate my meeting scheduling',
    description:
      'Coordinate calendars and send booking confirmations across multiple platforms',
  },
];

export function EmptyConversation() {
  const { session, setSession } = useChatSessionStore();
  const { mutate: sendMessage, isPending: isStreaming } =
    chatHooks.useSendMessage(setSession);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (!isStreaming) {
      sendMessage({
        message: `${suggestion.title}: ${suggestion.description}`,
        currentSession: isNil(session) ? null : session,
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4">
      <div className="text-center mb-12">
        <img
          src={quickLogoUrl}
          alt="Quick Logo"
          className="size-20 mb-6 opacity-80 mx-auto"
        />
        <h2 className="text-2xl font-semibold mb-2">
          {t('Welcome to Quick Assistant')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Start a conversation to get assistance with automation, workflows, and
          more
        </p>
      </div>

      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              variant="outline"
              className="p-4 justify-start h-auto text-left"
            >
              <div className="flex items-start gap-3 w-full">
                <div className="shrink-0 text-primary mt-0.5">
                  {suggestion.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1">
                    {suggestion.title}
                  </h3>
                  <p className="text-xs text-muted-foreground whitespace-normal">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
