import { t } from 'i18next';
import { Sparkles } from 'lucide-react';

import { flowScreenshotUtils } from '../../utils/flow-screenshot-utils';

export function StepNodeChatBadge({
  isEditing,
  isUpdated,
}: {
  isEditing: boolean;
  isUpdated: boolean;
}) {
  if (!isEditing && !isUpdated) {
    return null;
  }
  return (
    <div
      {...{ [flowScreenshotUtils.SCREENSHOT_EXCLUDE_ATTRIBUTE]: 'ignore-me' }}
      className="absolute -bottom-3 right-2 z-10 flex items-center gap-1 rounded-full border bg-accent-9 px-2 py-0.5 text-xs text-white shadow-sm animate-in fade-in zoom-in-95"
    >
      <Sparkles className="size-3" />
      {isEditing ? t('Chat is editing…') : t('Updated by chat')}
    </div>
  );
}
