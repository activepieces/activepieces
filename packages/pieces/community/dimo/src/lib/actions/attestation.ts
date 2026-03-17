import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoDeveloperAuth, DimoAuthProps } from '../common/auth';
import { DIMO_API_URLS } from '../common/constants';

export const dimoCreateVinVC = createAction({
  auth: dimoDeveloperAuth,
  name: 'attestation_create_vin_vc',
  displayName: 'Create VIN Verifiable Credential',
  description: 'Create a VIN Verifiable Credential for a vehicle. Requires Vehicle JWT with privilege 5.',
  props: {
    token_id: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The NFT token ID of the vehicle.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const vehicleJwt = auth.vehicle_jwt;

    if (!vehicleJwt) {
      throw new Error('Vehicle JWT is required for Attestation API calls.');
    }

    const tokenId = context.propsValue.token_id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DIMO_API_URLS.ATTESTATION}/v2/attestation/vin/${tokenId}`,
      headers: {
        Authorization: `Bearer ${vehicleJwt}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});

export const dimoCreateOdometerStatementVC = createAction({
  auth: dimoDeveloperAuth,
  name: 'attestation_create_odometer_vc',
  displayName: 'Create Odometer Statement Verifiable Credential',
  description: 'Create an Odometer Statement Verifiable Credential. Requires Vehicle JWT with privilege 4.',
  props: {
    token_id: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The NFT token ID of the vehicle.',
      required: true,
    }),
    timestamp: Property.ShortText({
      displayName: 'Timestamp (optional)',
      description: 'ISO 8601 timestamp for the odometer reading (e.g. 2023-01-01T00:00:00Z).',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const vehicleJwt = auth.vehicle_jwt;

    if (!vehicleJwt) {
      throw new Error('Vehicle JWT is required for Attestation API calls.');
    }

    const tokenId = context.propsValue.token_id;
    const timestamp = context.propsValue.timestamp;

    const body: Record<string, unknown> = {};
    if (timestamp) {
      body['timestamp'] = timestamp;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DIMO_API_URLS.ATTESTATION}/v2/attestation/odometer-statement/${tokenId}`,
      headers: {
        Authorization: `Bearer ${vehicleJwt}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});

export const dimoCreateVehicleHealthVC = createAction({
  auth: dimoDeveloperAuth,
  name: 'attestation_create_vehicle_health_vc',
  displayName: 'Create Vehicle Health Verifiable Credential',
  description: 'Create a Vehicle Health Verifiable Credential for a date range. Requires Vehicle JWT with privilege 4.',
  props: {
    token_id: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The NFT token ID of the vehicle.',
      required: true,
    }),
    start_time: Property.ShortText({
      displayName: 'Start Time',
      description: 'ISO 8601 start timestamp (e.g. 2023-01-01T00:00:00Z).',
      required: true,
    }),
    end_time: Property.ShortText({
      displayName: 'End Time',
      description: 'ISO 8601 end timestamp (e.g. 2023-01-31T23:59:59Z).',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const vehicleJwt = auth.vehicle_jwt;

    if (!vehicleJwt) {
      throw new Error('Vehicle JWT is required for Attestation API calls.');
    }

    const { token_id, start_time, end_time } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DIMO_API_URLS.ATTESTATION}/v2/attestation/vehicle-health/${token_id}`,
      headers: {
        Authorization: `Bearer ${vehicleJwt}`,
        'Content-Type': 'application/json',
      },
      body: {
        startTime: start_time,
        endTime: end_time,
      },
    });

    return response.body;
  },
});
