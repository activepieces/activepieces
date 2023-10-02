import { createPiece } from '@activepieces/pieces-framework';
import { ContentfulAuth } from './lib/common';
import { ContentfulCreateRecordAction } from './lib/actions/records';
import { ContentfulGetRecordAction } from './lib/actions/records/get-record';

export const contentful = createPiece({
  displayName: 'Contentful',
  auth: ContentfulAuth,
  minimumSupportedRelease: '0.6.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/contentful.png',
  authors: ['cyrilselasi'],
  actions: [ContentfulGetRecordAction, ContentfulCreateRecordAction],
  triggers: [],
});
