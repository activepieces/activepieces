export function toParticipantJids(participants: unknown[]): { id: string }[] {
  return participants
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0)
    .map((value) => ({ id: value.includes('@') ? value : `${value}@c.us` }));
}

export type ConductorParticipantResult = {
  JID: string;
  PhoneNumber: string;
  IsAdmin: boolean;
  IsSuperAdmin: boolean;
  DisplayName: string;
  Error: number;
};

export function flattenParticipantResults(results: ConductorParticipantResult[]) {
  return results.map((result) => ({
    jid: result.JID,
    phone_number: result.PhoneNumber?.replace('@s.whatsapp.net', '') ?? null,
    is_admin: result.IsAdmin,
    is_super_admin: result.IsSuperAdmin,
    display_name: result.DisplayName || null,
    error: result.Error,
  }));
}
