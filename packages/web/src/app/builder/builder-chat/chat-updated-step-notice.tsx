import { t } from 'i18next';
import { Sparkles } from 'lucide-react';

import { useBuilderStateContext } from '../builder-hooks';

export function ChatUpdatedStepNotice() {
  const isSelectedStepUpdated = useBuilderStateContext(
    (state) =>
      state.selectedStep !== null &&
      state.recentlyChangedSteps.includes(state.selectedStep),
  );
  if (!isSelectedStepUpdated) {
    return null;
  }
  return (
    <div className="flex items-center gap-2 border-b bg-accent-2 px-4 py-2 text-sm text-accent-11 animate-in fade-in slide-in-from-top-1">
      <Sparkles className="size-4" />
      {t('Chat updated this step. You are seeing its latest settings.')}
    </div>
  );
}
