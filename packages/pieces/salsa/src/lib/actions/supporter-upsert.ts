import { createAction, Property } from '@activepieces/pieces-framework';
import { salsaCommon } from '../common/common';
import { upsertSupporter } from './supporter';

export const salsaSupporterUpsert = createAction({
    name: 'supporter_upsert',
    description: 'Upsert Supporter based on Email',
    displayName: 'Upsert Supporter on Email',
    props: {
        authentication: salsaCommon.authentication,
        baseUrl: salsaCommon.baseUrl,
        supporters: Property.Json({
            displayName: "Supporters (JSON Array)",
            description: "The Supporters JSON Array",
            required: true
        })
    },
    async run(context) {
        return await upsertSupporter(context.propsValue);
    },
});