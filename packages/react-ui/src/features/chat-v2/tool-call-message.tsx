import { t } from 'i18next';
import {
  ListTodo,
  Wrench,
  FileText,
  Search,
  Map,
  Globe,
  Layers,
  FileOutput,
  RefreshCw,
  Activity,
  XCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  ConversationMessage,
  ToolCallConversationMessage,
} from '@activepieces/shared';

interface ToolCallMessageProps {
  message: ToolCallConversationMessage;
  conversation: ConversationMessage[];
  className?: string;
}

type ToolConfig = {
  icon: React.ReactNode;
  labelInProgress: string;
  labelCompleted: string;
};

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  write_todos: {
    icon: <ListTodo className="size-4 shrink-0" />,
    labelInProgress: 'Planning...',
    labelCompleted: 'Planning completed',
  },
  scrape: {
    icon: <FileText className="size-4 shrink-0" />,
    labelInProgress: 'Scraping page...',
    labelCompleted: 'Page scraped',
  },
  search: {
    icon: <Search className="size-4 shrink-0" />,
    labelInProgress: 'Searching...',
    labelCompleted: 'Search completed',
  },
  map: {
    icon: <Map className="size-4 shrink-0" />,
    labelInProgress: 'Mapping site...',
    labelCompleted: 'Site mapped',
  },
  crawl: {
    icon: <Globe className="size-4 shrink-0" />,
    labelInProgress: 'Crawling site...',
    labelCompleted: 'Site crawled',
  },
  batchScrape: {
    icon: <Layers className="size-4 shrink-0" />,
    labelInProgress: 'Batch scraping...',
    labelCompleted: 'Batch scrape completed',
  },
  extract: {
    icon: <FileOutput className="size-4 shrink-0" />,
    labelInProgress: 'Extracting data...',
    labelCompleted: 'Data extracted',
  },
  poll: {
    icon: <RefreshCw className="size-4 shrink-0" />,
    labelInProgress: 'Polling status...',
    labelCompleted: 'Poll completed',
  },
  status: {
    icon: <Activity className="size-4 shrink-0" />,
    labelInProgress: 'Checking status...',
    labelCompleted: 'Status checked',
  },
  cancel: {
    icon: <XCircle className="size-4 shrink-0" />,
    labelInProgress: 'Cancelling...',
    labelCompleted: 'Cancelled',
  },
};

export function ToolCallMessage({
  message,
  conversation,
  className,
}: ToolCallMessageProps) {
  const toolConfig = TOOL_CONFIGS[message.toolName];

  const isCompleted = conversation.some(
    (msg) =>
      msg.role === 'assistant' &&
      msg.parts.some(
        (part) =>
          part.type === 'tool-result' && part.toolCallId === message.toolCallId,
      ),
  );

  const getIcon = () => {
    if (toolConfig) {
      return toolConfig.icon;
    }
    return <Wrench className="size-4 text-muted-foreground shrink-0" />;
  };

  const getLabel = () => {
    if (toolConfig) {
      return isCompleted
        ? t(toolConfig.labelCompleted)
        : t(toolConfig.labelInProgress);
    }
    return isCompleted
      ? t('Used {toolName}', { toolName: message.toolName })
      : t('Using {toolName}', { toolName: message.toolName });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground py-1',
        className,
      )}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </div>
  );
}
