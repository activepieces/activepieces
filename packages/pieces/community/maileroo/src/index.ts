import { HttpError } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import FormData from 'form-data';
import { sendEmail } from './lib/actions/send-email';
import { sendFromTemplate } from './lib/actions/send-from-template';
import { checkEmail, sendFormData } from './lib/common/send-utils';
import { verifyEmail } from './lib/actions/verify-email';
import { mailerooAuth } from './lib/auth';

const markdown = `
For Sending API key, follow these steps:
1. Navigate to [Domains](https://app.maileroo.com/domains).
2. Click on the domain you want to use.
3. Click on the **Create sending key** under the API section.
4. Click **New Sending Key**.
5. Copy the key under the **Sending Key** column.

For Verification API key, follow these steps:
1. Navigate to [Verification API](https://app.maileroo.com/verifications).
2. Copy the key under the **Verification API** section.
`;

export const maileroo = createPiece({
  displayName: 'Maileroo',
  auth: mailerooAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/maileroo.png',
  categories: [
    PieceCategory.MARKETING,
    PieceCategory.BUSINESS_INTELLIGENCE,
    PieceCategory.COMMUNICATION,
  ],
  description: 'Email Delivery Service with Real-Time Analytics and Reporting',
  authors: ['codegino'],
  actions: [sendEmail, sendFromTemplate, verifyEmail],
  triggers: [],
});
