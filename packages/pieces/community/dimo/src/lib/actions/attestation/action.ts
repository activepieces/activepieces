import { createAction, Property } from '@activepieces/pieces-framework';
import { dimoAuth } from '../../auth';
import { DimoClient } from '../../common/helpers';
import { HttpError } from '@activepieces/pieces-common';

const createVinVcAction = createAction({
	auth: dimoAuth,
	name: 'attestation-create-vin-vc',
	displayName: 'Attestation : Create VIN VC',
	description: 'Generates the VIN VC for a given vehicle.',
	audience: 'both',
	aiMetadata: { description: 'Generate a VIN Verifiable Credential (VIN VC) for a DIMO vehicle, identified by its numeric vehicle token ID. This is a minting/attestation call that produces a fresh signed credential each time, so it is not idempotent; use it when an agent needs an on-chain-verifiable attestation of a vehicle\'s VIN rather than just reading current VIN data.', idempotent: false },
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			description: 'The ID of the vehicle for generating VIN Verifiable Credential for.',
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

			const response = await dimo.createVinVC({ vehicleJwt, tokenId: vehicleTokenId });

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

export const attestationApiActions = [createVinVcAction];
