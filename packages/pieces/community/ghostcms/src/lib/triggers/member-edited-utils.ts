const ACTIVITY_STAMP_FIELDS = ['updated_at', 'last_seen_at', 'geolocation'];

function hasMemberFieldChanges(body: unknown): boolean {
  if (typeof body !== 'object' || body === null || !('member' in body)) {
    return true;
  }
  const member = body.member;
  if (typeof member !== 'object' || member === null || !('previous' in member)) {
    return true;
  }
  const previous = member.previous;
  if (typeof previous !== 'object' || previous === null) {
    return true;
  }
  return Object.keys(previous).some(
    (field) => !ACTIVITY_STAMP_FIELDS.includes(field)
  );
}

export const memberEditedUtils = { hasMemberFieldChanges };
