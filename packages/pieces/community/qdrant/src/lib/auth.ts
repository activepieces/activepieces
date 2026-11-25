import { PieceAuth, Property } from '@activepieces/pieces-framework';

const qdrantConnectionDescription = `
### Using Qdrant cloud
1. Connect to your [Qdrant cloud account](https://cloud.qdrant.io)
2. Create a new cluster if it's the first time you  use Qdrant
3. Go to Data Access Control and create a new api key and copy it
4. Go to clusters, click on the arrow \`>\` and copy the Cluster URL.

### Using self-hosted Qdrant
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
