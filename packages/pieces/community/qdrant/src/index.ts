import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addPointsToCollection } from './lib/actions/add-points';
import { deleteCollection } from './lib/actions/delete-collection';
import { deletePoints } from './lib/actions/delete-points';
import { collectionInfos } from './lib/actions/get-collection-infos';
import { collectionList } from './lib/actions/get-collection-list';
import { getPoints } from './lib/actions/get-points';
import { searchPoints } from './lib/actions/search-points';

const qdrantConnectionDescription = `
# Qdrant Connection

## Using Qdrant cloud
1. Connect to your [Qdrant cloud account](https://cloud.qdrant.io)
2. Create a new cluster if it's the first time you  use Qdrant
3. Go to Data Access Control and create a new api key and copy it
4. Go to clusters, click on the arrow \`>\` and copy the Cluster URL

## Using self-hosted Qdrant
Try to create your own qdrant instance using the [documentation guides](https://qdrant.tech/documentation/guides/)
`;

export const qdrantAuth = PieceAuth.CustomAuth({
  description: qdrantConnectionDescription,
  props: {
    serverAddress: Property.ShortText({
      displayName: 'Server Address',
      required: true,
      description: 'The url of the Qdrant instance.',
    }),
    key: PieceAuth.SecretText({
      displayName: 'API KEY',
      required: true,
      description: 'Enter the API Key of your Qdrant account',
    }),
  },
  required: true,
});

export const qdrant = createPiece({
  displayName: 'Qdrant',
  description: 'Make any action on your qdrant vector database',
  auth: qdrantAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/qdrant.png',
  authors: ["ArmanGiau3","kishanprmr","abuaboud"],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [
    addPointsToCollection,
    collectionList,
    collectionInfos,
    deleteCollection,
    deletePoints,
    getPoints,
    searchPoints,
  ],
  triggers: [],
});
