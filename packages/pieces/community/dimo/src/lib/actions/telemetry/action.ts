import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { dimoAuth } from '../../auth';
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
	audience: 'both',
	aiMetadata: { description: 'Run an arbitrary GraphQL query against the DIMO Telemetry API for one vehicle (by token ID), passing the raw query string and optional variables. Read-only escape hatch for telemetry data not covered by the purpose-built telemetry actions; pick a specific action (Signals, Daily Avg Speed, Max Speed, Events, VIN VC Latest) when one fits, and use this only for custom shapes.', idempotent: true },
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
		const { clientId, apiKey, redirectUri } = context.auth.props;

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
	audience: 'both',
	aiMetadata: { description: 'List which telemetry signals are available for a specific vehicle (by token ID), so an agent can discover what data the vehicle reports before querying values. Read-only and idempotent; pick this to enumerate signal names, not to retrieve their time-series values (use Signals for that).', idempotent: true },
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
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
	audience: 'both',
	aiMetadata: { description: 'Retrieve telemetry signal values for a specific vehicle (by token ID) over a UTC start/end window, aggregated at a given interval (e.g. 1s, 1m, 1h). Read-only historical read; pick this for the vehicle\'s actual signal data over time, and use Available Signals first if you need to know which signals exist.', idempotent: true },
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			required: true,
		}),
        ...telemetryApiDateInputProps,
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth.props;
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
	audience: 'both',
	aiMetadata: { description: 'Get a vehicle\'s daily average speed over a UTC start/end window (by token ID). Read-only aggregate computed by DIMO, so it is idempotent; pick this for average-speed analytics, versus Max Speed for the peak value over the same period.', idempotent: true },
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			required: true,
		}),
        ...telemetryApiDateInputPropsWithoutInterval,
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth.props;
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
	audience: 'both',
	aiMetadata: { description: 'Retrieve discrete vehicle events (e.g. trips, status changes) for a specific vehicle (by token ID) over a UTC start/end window. Read-only and idempotent; pick this for event records over a period rather than continuous signal samples (Signals) or speed aggregates (Daily Avg Speed / Max Speed).', idempotent: true },
	props: {
		vehicleTokenId: Property.Number({
		displayName: 'Vehicle Token ID',
		required: true,
	}),
	...telemetryApiDateInputPropsWithoutInterval,
    },
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth.props;
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
	audience: 'both',
	aiMetadata: { description: 'Get a vehicle\'s maximum speed over a UTC start/end window at a given sampling interval (by token ID). Read-only aggregate, so it is idempotent; pick this for the peak speed reached, versus Daily Avg Speed for the average over the same period.', idempotent: true },
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			required: true,
		}),
        ...telemetryApiDateInputProps,
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth.props;
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
	audience: 'both',
	aiMetadata: { description: 'Read the most recent VIN Verifiable Credential and vehicle configuration already on record for a specific vehicle (by token ID). Read-only and idempotent; pick this to fetch the existing latest VIN VC, versus the Attestation Create VIN VC action which mints a new credential.', idempotent: true },
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
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
