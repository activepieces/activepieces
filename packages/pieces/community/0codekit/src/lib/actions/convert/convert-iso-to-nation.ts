import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { nationIsoApi } from '../../common/nation-iso';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const convertIsoToNationAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'convert_iso_to_nation',
    classification: 'READ',
    displayName: 'Convert ISO to Nation',
    description: 'Get the English country name for an ISO country code.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the English country name for an ISO country code such as DE. Use "Convert Nation to ISO" for the reverse direction. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        iso: Property.ShortText({
            displayName: 'ISO Country Code',
            description: 'The ISO country code, for example `DE`.',
            required: true,
            placeholder: 'DE',
        }),
    },
    outputSchema: dateConvertSchemas.nationIso,
    async run({ auth, propsValue }) {
        return nationIsoApi.convert({
            apiKey: auth.secret_text,
            body: { iso: propsValue.iso.trim() },
        });
    },
});
