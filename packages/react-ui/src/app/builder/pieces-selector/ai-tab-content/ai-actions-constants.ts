import { PieceSelectorItem } from '@/lib/types';
import { FlowActionType } from '@activepieces/shared';

export const ACTION_ICON_MAP: Record<string, string> = {
  run_agent: 'https://cdn.activepieces.com/pieces/agent.png',
  generateImage: 'https://cdn.activepieces.com/pieces/image-ai.svg',
  askAi: 'https://cdn.activepieces.com/pieces/text-ai.svg',
  summarizeText: 'https://cdn.activepieces.com/pieces/text-ai.svg',
  classifyText: 'https://cdn.activepieces.com/pieces/text-ai.svg',
  extractStructuredData: 'https://cdn.activepieces.com/pieces/ai-utility.svg',
} as const;

export const ACTION_VIDEO_MAP: Record<string, string> = {
  run_agent: 'https://cdn.activepieces.com/pieces/ai/native/ai-agents.mp4',
  generateImage:
    'https://cdn.activepieces.com/pieces/ai/native/generate-images.mp4',
  askAi: 'https://cdn.activepieces.com/pieces/ai/native/ask-ai.mp4',
  summarizeText:
    'https://cdn.activepieces.com/pieces/ai/native/summarize-text.mp4',
  classifyText:
    'https://cdn.activepieces.com/pieces/ai/native/classify-text.mp4',
  extractStructuredData:
    'https://cdn.activepieces.com/pieces/ai/native/ocr.mp4',
} as const;

export const DEFAULT_ACTION_ICON =
  'https://cdn.activepieces.com/pieces/image-ai.svg';

export const RUN_AGENT_ACTION_NAME = 'run_agent';

export const getActionName = (item: PieceSelectorItem): string | null => {
  if (item.type === FlowActionType.PIECE && 'actionOrTrigger' in item) {
    return item.actionOrTrigger.name;
  }
  return null;
};

export const isRunAgentAction = (item: PieceSelectorItem): boolean => {
  const actionName = getActionName(item);
  return actionName === RUN_AGENT_ACTION_NAME;
};

export const getActionIcon = (item: PieceSelectorItem): string => {
  const actionName = getActionName(item);
  return actionName
    ? ACTION_ICON_MAP[actionName] || DEFAULT_ACTION_ICON
    : DEFAULT_ACTION_ICON;
};

export const getActionVideo = (item: PieceSelectorItem): string | null => {
  const actionName = getActionName(item);
  return actionName ? ACTION_VIDEO_MAP[actionName] || null : null;
};

export const getItemKey = (item: PieceSelectorItem, index: number): string => {
  const actionName = getActionName(item);
  if (actionName) {
    return actionName;
  }
  if (item.type === FlowActionType.PIECE && 'actionOrTrigger' in item) {
    return item.actionOrTrigger.displayName;
  }
  if ('displayName' in item) {
    return item.displayName;
  }
  return `action-${index}`;
};
