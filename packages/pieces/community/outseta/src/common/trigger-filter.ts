// Outseta webhook payloads don't carry event-type metadata — only the
// entity. The only signal we can reliably extract is "was this just
// created?" (Updated within a few seconds of Created) versus "was this
// modified later?" (Updated significantly after Created). This helper
// uses that signal as a coarse safety net: it can drop a Created-shaped
// payload when the user only asked for non-create events, and vice
// versa, which catches accidental Outseta misconfiguration.
//
// It cannot distinguish between non-create sub-events (e.g. Updated vs
// Deleted vs Stage Updated). Fine-grained routing must be done at the
// source by configuring only the Outseta notifications you actually
// want for this webhook URL.
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
