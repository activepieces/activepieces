import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { wufooApiCall } from './lib/common/client';
import { createFormEntryAction } from './lib/actions/create-form-entry';
import { findFormAction } from './lib/actions/find-form';
import { findSubmissionByFieldAction } from './lib/actions/find-submission-by-field';
import { getEntryDetailsAction } from './lib/actions/get-entry-details';
import { newFormEntryTrigger } from './lib/triggers/new-form-entry';
import { newFormTrigger } from './lib/triggers/new-form';
import { AppConnectionType } from '@activepieces/shared';
import { wufooAuth } from './lib/auth';

export const wufoo = createPiece({
  displayName: 'Wufoo',
  auth: wufooAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wufoo.png',
  authors: ['krushnarout','onyedikachi-david'],
  actions: [
    createFormEntryAction,
    findFormAction,
    findSubmissionByFieldAction,
    getEntryDetailsAction,
    createCustomApiCallAction({
      auth: wufooAuth,
      baseUrl: (auth: any) => `https://${auth.subdomain}.wufoo.com/api/v3`,
      authMapping: async (auth) => {
        const { apiKey } = auth.props;
        const encoded = Buffer.from(`${apiKey}:footastic`).toString('base64');
        return {
          Authorization: `Basic ${encoded}`,
        };
      },
    }),
  ],
  triggers: [newFormEntryTrigger, newFormTrigger],
});
