import { useResourceLock } from '@/hooks/use-resource-lock';

import { useBuilderStateContext } from '../../builder-hooks';

function useFlowLock() {
  const [readonly, flowId, setReadOnly] = useBuilderStateContext((state) => [
    state.readonly,
    state.flow.id,
    state.setReadOnly,
  ]);

  const { lockedBy, takeOver } = useResourceLock({
    resourceId: flowId,
  });

  if (lockedBy && !readonly) {
    setReadOnly(true);
  }

  return { lockedBy, takeOver };
}

export { useFlowLock };
