import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { dimoAuth } from '../../../index';
import { DimoClient } from '../../common/helpers';

const tokenExchangeApiAction = createAction({
	auth: dimoAuth,
	name: 'token-exchange-get-vehicle-jwt',
	displayName: 'Token Exchange : Get Vehicle JWT',
	description: 'Creates a token exchange to obtain a Vehicle JWT.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			description: 'The ID of the vehicle for getting Vehicle JWT.',
			required: true,
		}),
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth;
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
