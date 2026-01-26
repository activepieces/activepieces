import { t } from 'i18next';
import { useState } from 'react';
import {
  Wrench,
  Search,
  ChevronRight,
  ChevronDown,
  List,
  PenTool,
  AlertCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  ToolCallConversationMessage,
} from '@activepieces/shared';

interface ToolCallMessageProps {
  message: ToolCallConversationMessage;
  className?: string;
}

type ToolConfig = {
  icon: React.ReactNode;
  labelInProgress: string;
  labelCompleted: string;
};

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  // Agent tools
  search_triggers: {
    icon: <Search className="size-4 shrink-0" />,
    labelInProgress: 'Searching for triggers...',
    labelCompleted: 'Found triggers',
  },
  search_tools: {
    icon: <Search className="size-4 shrink-0" />,
    labelInProgress: 'Searching for tools...',
    labelCompleted: 'Found tools',
  },
  list_flows: {
    icon: <List className="size-4 shrink-0" />,
    labelInProgress: 'Loading your flows...',
    labelCompleted: 'Loaded flows',
  },
  write_flows: {
    icon: <PenTool className="size-4 shrink-0" />,
    labelInProgress: 'Building your flow...',
    labelCompleted: 'Flow created',
  },
};

export function ToolCallMessage({
  message,
  className,
}: ToolCallMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toolConfig = TOOL_CONFIGS[message.toolName];

  const isCompleted = message.status === 'completed';
  const isLoading = message.status === 'loading' || message.status === 'ready';
  const isError = message.status === 'error';

  const getIcon = () => {
    if (toolConfig) {
      return toolConfig.icon;
    }
    return <Wrench className="size-3 text-muted-foreground shrink-0" />;
  };

  const getLabel = () => {
    if (toolConfig) {
      return isCompleted || isError
        ? t(toolConfig.labelCompleted)
        : t(toolConfig.labelInProgress);
    }
    return isCompleted || isError
      ? t('Used {toolName}', { toolName: message.toolName })
      : t('Using {toolName}', { toolName: message.toolName });
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn('text-sm', className)}>
      <div
        className={cn(
          'flex items-center gap-2 py-1 cursor-pointer select-none',
          isLoading && 'animate-pulse',
        )}
        onClick={handleToggle}
      >
        {isError ? (
          <AlertCircle className="size-4 shrink-0 text-destructive" />
        ) : (
          getIcon()
        )}
        <span className="text-muted-foreground">
          {getLabel()}
        </span>
        {isExpanded ? (
          <ChevronDown className="size-3 shrink-0 text-muted-foreground self-center" />
        ) : (
          <ChevronRight className="size-3 shrink-0 text-muted-foreground self-center" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {message.input && (
            <div className="bg-accent rounded-md p-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {t('Arguments')}
              </div>
              <pre className="text-xs overflow-auto whitespace-pre-wrap break-all">
                {JSON.stringify(message.input, null, 2)}
              </pre>
            </div>
          )}

          {isError && message.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <div className="text-xs font-medium text-destructive mb-1">
                {t('Error')}
              </div>
              <pre className="text-xs overflow-auto whitespace-pre-wrap break-all text-destructive">
                {message.error}
              </pre>
            </div>
          )}

          {message.output && (
            <div className="bg-accent rounded-md p-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {t('Result')}
              </div>
              <pre className="text-xs overflow-auto whitespace-pre-wrap break-all">
                {JSON.stringify(message.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
