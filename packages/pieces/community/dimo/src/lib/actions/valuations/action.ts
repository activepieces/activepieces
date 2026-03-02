import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { dimoAuth } from '../../../index';
import { DimoClient } from '../../common/helpers';

const getVehicleValuationsAction = createAction({
	auth: dimoAuth,
	name: 'valuations-get-vehicle-valuations',
	displayName: 'Valuations : Get Vehicle Valuations',
	description: 'Retrieve current valuation of a vehicle, including trade-in and retail values from valuation providers like Drivly. Valuations are calculated based on vehicle make, model, year, and odometer readings.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			description: 'The ERC-721 token ID of the vehicle to get valuations for.',
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

			const response = await dimo.getVehicleValuations({
				vehicleJwt,
				tokenId: vehicleTokenId,
			});

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

const requestInstantOfferAction = createAction({
	auth: dimoAuth,
	name: 'valuations-request-instant-offer',
	displayName: 'Valuations : Request Instant Offer',
	description: 'Submit an instant offer request to third-party vehicle buying services such as Carvana, CarMax, and Vroom. This endpoint will refresh existing unexpired offers if they already exist for the vehicle.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			description: 'The ERC-721 token ID of the vehicle to request offers for.',
			required: true,
		}),
		provider: Property.StaticDropdown({
			displayName: 'Provider',
			description: 'The third-party service to request an instant offer from.',
			required: false,
			options: {
				options: [
					{ label: 'All Providers', value: 'all' },
					{ label: 'Carvana', value: 'carvana' },
					{ label: 'CarMax', value: 'carmax' },
					{ label: 'Vroom', value: 'vroom' },
				],
			},
			defaultValue: 'all',
		}),
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth.props;
		const { vehicleTokenId, provider } = context.propsValue;

		const dimo = new DimoClient({
			clientId,
			apiKey,
			redirectUri,
		});

		try {
			const developerJwt = await dimo.getDeveloperJwt();
			const vehicleJwt = await dimo.getVehicleJwt({ developerJwt, tokenId: vehicleTokenId });

			const response = await dimo.requestInstantOffer({
				vehicleJwt,
				tokenId: vehicleTokenId,
				provider: provider === 'all' ? undefined : provider,
			});

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

const getVehicleOffersAction = createAction({
	auth: dimoAuth,
	name: 'valuations-get-vehicle-offers',
	displayName: 'Valuations : Get Vehicle Offers',
	description: 'List all existing unexpired offers for a vehicle from prior instant-offer submissions. Returns offers from services like Carvana, CarMax, and Vroom with their offer amounts and expiration dates.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			description: 'The ERC-721 token ID of the vehicle to retrieve offers for.',
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

			const response = await dimo.getVehicleOffers({
				vehicleJwt,
				tokenId: vehicleTokenId,
			});

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

export const valuationsApiActions = [
	getVehicleValuationsAction,
	requestInstantOfferAction,
	getVehicleOffersAction,
];
