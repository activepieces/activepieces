import { PieceAuth } from '@activepieces/pieces-framework';

export const pdfCoAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `To get your PDF.co API key please [click here to create your account](https://app.pdf.co/).`,
	required: true,
});
