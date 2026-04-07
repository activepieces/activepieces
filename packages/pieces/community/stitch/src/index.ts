import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { stitchAuth } from './lib/auth';
import { listSourcesAction } from './lib/actions/list-sources';
import { getSourceAction } from './lib/actions/get-source';
import { createSourceAction } from './lib/actions/create-source';
import { updateSourceAction } from './lib/actions/update-source';
import { deleteSourceAction } from './lib/actions/delete-source';
import { listDestinationsAction } from './lib/actions/list-destinations';
import { createDestinationAction } from './lib/actions/create-destination';
import { updateDestinationAction } from './lib/actions/update-destination';
import { listStreamsAction } from './lib/actions/list-streams';
import { updateStreamMetadataAction } from './lib/actions/update-stream-metadata';
import { pushDataAction } from './lib/actions/push-data';
import { validateDataAction } from './lib/actions/validate-data';
import { newSourceTrigger } from './lib/triggers/new-source';

export { stitchAuth };

export const stitch = createPiece({
  displayName: 'Stitch',
  description:
    'Stitch is a cloud-first data pipeline platform that ETLs data from SaaS apps and databases into your data warehouse.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMDAgMTAwJz48cmVjdCB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgcng9JzIwJyBmaWxsPScjZmZjMjAwJy8+PHRleHQgeD0nNTAnIHk9JzY1JyBmb250LWZhbWlseT0nQXJpYWwnIGZvbnQtd2VpZ2h0PSdib2xkJyBmb250LXNpemU9JzUwJyBmaWxsPScjMDAwMDAwJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJz5TPC90ZXh0Pjwvc3ZnPg==',
  categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.BUSINESS_INTELLIGENCE],
  auth: stitchAuth,
  authors: ['activepieces'],
  actions: [
    listSourcesAction,
    getSourceAction,
    createSourceAction,
    updateSourceAction,
    deleteSourceAction,
    listDestinationsAction,
    createDestinationAction,
    updateDestinationAction,
    listStreamsAction,
    updateStreamMetadataAction,
    pushDataAction,
    validateDataAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.stitchdata.com',
      auth: stitchAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as unknown as { connect_api_token: string }).connect_api_token}`,
      }),
    }),
  ],
  triggers: [newSourceTrigger],
});
