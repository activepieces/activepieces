export function shouldFireOnPayload(args: {
  payload: Record<string, unknown>;
  selectedSubTypes: string[];
  createSubType: string;
  updateSubTypes: string[];
}): boolean {
  const { payload, selectedSubTypes, createSubType, updateSubTypes } = args;

  const createdRaw = payload['Created'];
  const updatedRaw = payload['Updated'];
  if (typeof createdRaw !== 'string' || typeof updatedRaw !== 'string') {
    return true;
  }

  const diffMs = Math.abs(
    new Date(updatedRaw).getTime() - new Date(createdRaw).getTime()
  );
  const looksLikeCreate = diffMs < CREATE_DETECTION_WINDOW_MS;

  const selectedHasCreate = selectedSubTypes.includes(createSubType);
  const selectedHasUpdate = updateSubTypes.some((s) =>
    selectedSubTypes.includes(s)
  );

  if (looksLikeCreate && !selectedHasCreate) return false;
  if (!looksLikeCreate && !selectedHasUpdate) return false;
  return true;
}

const CREATE_DETECTION_WINDOW_MS = 2000;
