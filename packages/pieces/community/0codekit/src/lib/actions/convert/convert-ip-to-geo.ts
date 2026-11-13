import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const convertIpToGeoAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'convert_ip_to_geo',
    classification: 'READ',
    displayName: 'Convert IP to Geo',
    description: 'Look up the country, city, coordinates and provider of an IP address.',
    audience: 'both',
    aiMetadata: {
        description:
            'Geolocate a public IPv4 or IPv6 address and return its country, region, city, postal code, latitude/longitude, time zone and internet provider. Private or local addresses cannot be located. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        ip: Property.ShortText({
            displayName: 'IP Address',
            description: 'The public IP address to look up.',
            required: true,
            placeholder: '87.155.190.147',
        }),
    },
    outputSchema: dateConvertSchemas.ipToGeo,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<IpToGeoResponse>({
            apiKey: auth.secret_text,
            path: '/convert/iptogeo',
            body: { ip: propsValue.ip.trim() },
        });
        return {
            ip: response.query ?? null,
            country: response.country ?? null,
            country_code: response.countryCode ?? null,
            region_code: response.region ?? null,
            region_name: response.regionName ?? null,
            city: response.city ?? null,
            zip: response.zip ?? null,
            latitude: response.lat ?? null,
            longitude: response.lon ?? null,
            time_zone: response.timezone ?? null,
            isp: response.isp ?? null,
            organization: response.org ?? null,
            autonomous_system: response.as ?? null,
        };
    },
});

type IpToGeoResponse = {
    status?: string;
    country?: string;
    countryCode?: string;
    region?: string;
    regionName?: string;
    city?: string;
    zip?: string;
    lat?: number;
    lon?: number;
    timezone?: string;
    isp?: string;
    org?: string;
    as?: string;
    query?: string;
};
