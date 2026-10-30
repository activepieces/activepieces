import type { AppConnectionType } from '@activepieces/pieces-framework';

export type RobollyAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type RobollyTemplate = { id: string; name: string };
export type RobollyAcceptedModification = { key: string; type: string };
export type RobollyTemplatesResponse = { templates: RobollyTemplate[] };
export type RobollyAcceptedModificationsResponse = {
	acceptedModifications: RobollyAcceptedModification[];
};
export type RobollyRender = {
	id: string;
	status?: string;
	templateId?: string;
	file?: string;
	preview?: string;
	createdAt?: string;
};
export type RobollyRendersPage = {
	hasMore?: boolean;
	paginationCursorNext?: string | null;
	paginationCursorPrevious?: string | null;
	data?: RobollyRender[];
	value?: RobollyRender[];
};
export type RobollyTemplateFields = {
	name?: string;
	artboardWidth?: number;
	artboardHeight?: number;
	backgroundColor?: string;
	path?: string;
	renderFileName?: string;
	disallowNotSigned?: boolean;
};
