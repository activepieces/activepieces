import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { dimoAuth } from '../../../index';
import { DimoClient } from '../../common/helpers';
import { TelemetryQueries } from '../../common/queries';


const telemetryApiDateInputProps = {
    startDate: Property.DateTime({
        displayName: 'Start Date',
        description: 'Start date for the query in UTC, formatted as 2025-07-07T12:00:00Z',
        required: true,
    }),
    endDate: Property.DateTime({
        displayName: 'End Date',
        description: 'End date for the query in UTC, formatted as 2025-07-09T12:00:00Z',
        required: true,
    }),
    interval: Property.ShortText({
        displayName: 'Interval',
        description: 'Interval (e.g. 1s, 1m, 1h).',
        required: true,
    }),
}

const { interval, ...telemetryApiDateInputPropsWithoutInterval } = telemetryApiDateInputProps;

const telemetryApiCustomQueryAction = createAction({
	auth: dimoAuth,
	name: 'telemetry-custom-query',
	displayName: 'Telemetry : Custom Query',
	description: 'Query DIMO Telemetry API using a custom GraphQL query.',
	props: {
		customQuery: Property.LongText({
			displayName: 'Custom GraphQL Query.',
			required: true,
		}),
		variables: Property.Json({
			displayName: 'Variables',
			required: false,
		}),
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID.',
			required: true,
		}),
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth;

		const { customQuery, vehicleTokenId, variables = {} } = context.propsValue;

		const dimo = new DimoClient({
			clientId,
			apiKey,
			redirectUri,
		});

		try {
			const developerJwt = await dimo.getDeveloperJwt();

			const vehicleJwt = await dimo.getVehicleJwt({ developerJwt, tokenId: vehicleTokenId });

			const response = await dimo.sendTelemetryGraphQLRequest({
				vehiclejwt: vehicleJwt,
				query: customQuery,
				variables,
			});

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

const availableSignalsAction = createAction({
	auth: dimoAuth,
	name: 'telemetry-available-signals',
	displayName: 'Telemetry : Available Signals',
	description: 'Get a list of available signals for a specific vehicle.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
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

			const query = TelemetryQueries.avaiableSignals.replace('<tokenId>', String(vehicleTokenId));

			const response = await dimo.sendTelemetryGraphQLRequest({
				vehiclejwt: vehicleJwt,
				query,
				variables: {},
			});

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

const signalsAction = createAction({
	auth: dimoAuth,
	name: 'telemetry-signals',
	displayName: 'Telemetry : Signals',
	description: 'Get a selection of available signals for a specific vehicle.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			required: true,
		}),
        ...telemetryApiDateInputProps,
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth;
		const { vehicleTokenId, startDate, endDate, interval } = context.propsValue;

		const dimo = new DimoClient({
			clientId,
			apiKey,
			redirectUri,
		});

		try {
			const developerJwt = await dimo.getDeveloperJwt();

			const vehicleJwt = await dimo.getVehicleJwt({ developerJwt, tokenId: vehicleTokenId });

			const query = TelemetryQueries.signals
				.replace('<tokenId>', String(vehicleTokenId))
				.replace('<startDate>', startDate)
				.replace('<endDate>', endDate)
				.replace('<interval>', interval);
			const response = await dimo.sendTelemetryGraphQLRequest({
				vehiclejwt: vehicleJwt,
				query,
				variables: {},
			});

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});


const getDailyAvgSpeedOfVehicleAction = createAction({
	auth: dimoAuth,
	name: 'telemetry-daily-avg-speed',
	displayName: 'Telemetry : Daily Avg Speed',
	description: 'Get the average speed of a vehicle over a specific time period.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			required: true,
		}),
        ...telemetryApiDateInputPropsWithoutInterval,
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth;
		const { vehicleTokenId, startDate, endDate } = context.propsValue;

		const dimo = new DimoClient({
			clientId,
			apiKey,
			redirectUri,
		});

		try {
			const developerJwt = await dimo.getDeveloperJwt();

			const vehicleJwt = await dimo.getVehicleJwt({ developerJwt, tokenId: vehicleTokenId });

			const query = TelemetryQueries.getDailyAvgSpeedOfVehicle
				.replace('<tokenId>', String(vehicleTokenId))
				.replace('<startDate>', startDate)
				.replace('<endDate>', endDate);

			const response = await dimo.sendTelemetryGraphQLRequest({
				vehiclejwt: vehicleJwt,
				query,
				variables: {},
			});

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

const getEvents = createAction({
	auth: dimoAuth,
	name: 'telemetry-event',
	displayName: 'Telemetry: Events',
	description: 'Get the vehicle events over a specific time period.',
	props: {
		vehicleTokenId: Property.Number({
		displayName: 'Vehicle Token ID',
		required: true,
	}),
	...telemetryApiDateInputPropsWithoutInterval,
    },
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth;
		const { vehicleTokenId, startDate, endDate } = context.propsValue;

		const dimo = new DimoClient({
			clientId,
			apiKey,
			redirectUri,
		});

        try {
			const developerJwt = await dimo.getDeveloperJwt();

			const vehicleJwt = await dimo.getVehicleJwt({ developerJwt, tokenId: vehicleTokenId });

			const query = TelemetryQueries.getEvents
				.replace('<tokenId>', String(vehicleTokenId))
				.replace('<startDate>', startDate)
				.replace('<endDate>', endDate);

			const response = await dimo.sendTelemetryGraphQLRequest({
				vehiclejwt: vehicleJwt,
				query,
				variables: {},
			});

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
    },
});

const getMaxSpeedOfVehicleAction = createAction({
	auth: dimoAuth,
	name: 'telemetry-max-speed',
	displayName: 'Telemetry : Max Speed',
	description: 'Get the maximum speed of a vehicle over a specific time period.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			required: true,
		}),
        ...telemetryApiDateInputProps,
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth;
		const { vehicleTokenId, startDate, endDate, interval } = context.propsValue;

		const dimo = new DimoClient({
			clientId,
			apiKey,
			redirectUri,
		});

		try {
			const developerJwt = await dimo.getDeveloperJwt();

			const vehicleJwt = await dimo.getVehicleJwt({ developerJwt, tokenId: vehicleTokenId });

			const query = TelemetryQueries.getMaxSpeedOfVehicle
				.replace('<tokenId>', String(vehicleTokenId))
				.replace('<startDate>', startDate)
				.replace('<endDate>', endDate)
				.replace('<interval>', interval);

			const response = await dimo.sendTelemetryGraphQLRequest({
				vehiclejwt: vehicleJwt,
				query,
				variables: {},
			});

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

const getVinVcLatestAction = createAction({
	auth: dimoAuth,
	name: 'telemetry-vin-vc-latest',
	displayName: 'Telemetry : VIN VC Latest',
	description: 'Get the latest VIN and Vehicle Configuration for a specific vehicle.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
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

			const query = TelemetryQueries.getVinVcLatest.replace('<tokenId>', String(vehicleTokenId));

			const response = await dimo.sendTelemetryGraphQLRequest({
				vehiclejwt: vehicleJwt,
				query,
				variables: {},
			});

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

export const telemetryApiActions = [
	telemetryApiCustomQueryAction,
	availableSignalsAction,
	signalsAction,
	getDailyAvgSpeedOfVehicleAction,
	getEvents,
	getMaxSpeedOfVehicleAction,
	getVinVcLatestAction,
];
