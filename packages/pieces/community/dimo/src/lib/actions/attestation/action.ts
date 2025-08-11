import { createAction, Property } from '@activepieces/pieces-framework';
import { dimoAuth } from '../../../index';
import { DimoClient } from '../../common/helpers';
import { HttpError } from '@activepieces/pieces-common';

const createVinVcAction = createAction({
	auth: dimoAuth,
	name: 'attestation-create-vin-vc',
	displayName: 'Attestation : Create VIN VC',
	description: 'Generates the VIN VC for a given vehicle.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			description: 'The ID of the vehicle for generating VIN Verifiable Credential for.',
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

			const response = await dimo.createVinVC({ vehicleJwt, tokenId: vehicleTokenId });

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

export const attestationApiActions = [createVinVcAction];
