import { Property } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://api.pdf.co/v1';

export const commonProps = {
	fileName: Property.ShortText({
		displayName: 'File Name',
		description: 'Desired name for the output PDF file (e.g., "result.pdf").',
		required: false,
	}),
	expiration: Property.Number({
		displayName: 'Expiration Time in Minutes',
		description:
			'Set the expiration time for the output link in minutes (default is 60 i.e 60 minutes or 1 hour).',
		required: false,
	}),
	pdfPassword: Property.ShortText({
		displayName: 'Source PDF Password',
		description: 'Password if the source PDF is protected.',
		required: false,
	}),
	httpUsername: Property.ShortText({
		displayName: 'HTTP Username',
		description: 'HTTP auth username if required to access source url.',
		required: false,
	}),
	httpPassword: Property.ShortText({
		displayName: 'HTTP Password',
		description: 'HTTP auth password if required to access source url.',
		required: false,
	}),
};
