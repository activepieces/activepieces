import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const calculateGeoDistanceAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'calculate_geo_distance',
    classification: 'READ',
    displayName: 'Calculate Geo Distance',
    description: 'Get the travel distance and time between two addresses.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the route distance in kilometres and the estimated travel time between two addresses or places for a travel mode (driving, walking, bicycling, transit). This is a route distance, not a straight line. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        startPoint: Property.ShortText({
            displayName: 'Start Address',
            description: 'Where the trip starts. An address, city or place name.',
            required: true,
            placeholder: 'Berlin',
        }),
        endPoint: Property.ShortText({
            displayName: 'End Address',
            description: 'Where the trip ends. An address, city or place name.',
            required: true,
            placeholder: 'Munich',
        }),
        mode: Property.StaticDropdown({
            displayName: 'Travel Mode',
            description: 'How the trip is made. This changes the route and the travel time.',
            required: true,
            defaultValue: 'driving',
            options: {
                options: [
                    { label: 'Driving', value: 'driving' },
                    { label: 'Walking', value: 'walking' },
                    { label: 'Bicycling', value: 'bicycling' },
                    { label: 'Public transit', value: 'transit' },
                ],
            },
        }),
    },
    outputSchema: dateConvertSchemas.geoDistance,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<GeoDistanceResponse>({
            apiKey: auth.secret_text,
            path: '/calculate/geodistance-v2',
            body: {
                startPoint: propsValue.startPoint,
                endPoint: propsValue.endPoint,
                mode: propsValue.mode,
            },
        });
        return {
            distance_km: response.distanceInKM ?? null,
            duration_hours: response.duration?.hours ?? null,
            duration_minutes: response.duration?.minutes ?? null,
        };
    },
});

type GeoDistanceResponse = {
    distanceInKM?: number;
    duration?: {
        hours?: number;
        minutes?: number;
    };
};
