import type { AppConnectionType } from '@activepieces/pieces-framework';

export type ClockifyAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type ClockifyUser = { id: string; email: string; name?: string };
export type ClockifyWorkspace = { id: string; name: string };
export type ClockifyProject = { id: string; name: string };
export type ClockifyTask = { id: string; name: string; projectId?: string; status?: string };
export type ClockifyTag = { id: string; name: string };
export type ClockifyTimeEntry = { id: string; description?: string };
export type ClockifyWebhook = { id: string };
