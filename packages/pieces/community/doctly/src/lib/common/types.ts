import type { AppConnectionType } from '@activepieces/pieces-framework';

export type DoctlyAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type DoctlyCreateDocumentResponse = {
	id: string;
	file_name: string;
	status: string;
};

export type DoctlyDocument = {
	id: string;
	file_name: string;
	status: string;
	output_file_url: string;
};
