import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { dimoAuth } from '../../auth';
import { DimoClient } from '../../common/helpers';

const tokenExchangeApiAction = createAction({
	auth: dimoAuth,
	name: 'token-exchange-get-vehicle-jwt',
	displayName: 'Token Exchange : Get Vehicle JWT',
	description: 'Creates a token exchange to obtain a Vehicle JWT.',
	audience: 'both',
	aiMetadata: { description: 'Exchange the developer credentials for a short-lived Vehicle JWT scoped to a single vehicle token ID, which other DIMO calls need to read that vehicle\'s privileged data. Read-only token exchange with no side effects; pick it when you must obtain a vehicle-scoped access token directly rather than letting a higher-level action fetch one internally.', idempotent: true },
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			description: 'The ID of the vehicle for getting Vehicle JWT.',
			required: true,
		}),
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth.props;
		const { vehicleTokenId } = context.propsValue;

		const dimo = new DimoClient({
			clientId,
			apiKey,
			redirectUri,
		});

		try {
			const developerJwt = await dimo.getDeveloperJwt();

			const vehicleJwt = await dimo.getVehicleJwt({ developerJwt, tokenId: vehicleTokenId });

			return {vehicleJwt};
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

export const tokenExchangeApiActions = [tokenExchangeApiAction];
