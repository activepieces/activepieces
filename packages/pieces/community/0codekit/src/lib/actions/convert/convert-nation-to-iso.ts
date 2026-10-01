import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { nationIsoApi } from '../../common/nation-iso';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const convertNationToIsoAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'convert_nation_to_iso',
    classification: 'READ',
    displayName: 'Convert Nation to ISO',
    description: 'Get the ISO country code for an English country name.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the ISO country code for a country name written in English, such as Germany. Use "Convert ISO to Nation" for the reverse direction. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        nation: Property.ShortText({
            displayName: 'Country Name',
            description: 'The country name in English, for example `Germany`.',
            required: true,
            placeholder: 'Germany',
        }),
    },
    outputSchema: dateConvertSchemas.nationIso,
    async run({ auth, propsValue }) {
        return nationIsoApi.convert({
            apiKey: auth.secret_text,
            body: { nation: propsValue.nation.trim() },
        });
    },
});
