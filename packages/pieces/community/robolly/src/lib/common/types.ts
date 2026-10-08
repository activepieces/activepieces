import type { AppConnectionType } from '@activepieces/pieces-framework';

export type RobollyAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type RobollyTemplate = { id: string; name: string };
export type RobollyAcceptedModification = { key: string; type: string };
export type RobollyTemplatesResponse = { templates: RobollyTemplate[] };
export type RobollyAcceptedModificationsResponse = {
	acceptedModifications: RobollyAcceptedModification[];
};
