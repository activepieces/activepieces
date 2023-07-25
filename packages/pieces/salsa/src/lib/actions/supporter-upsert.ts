import { createAction, Property } from '@activepieces/pieces-framework';
import { salsaCommon } from '../common/common';
import { salsaAuth } from '../..';
import { upsertSupporter } from './supporter';

export const salsaSupporterUpsert = createAction({
    auth: salsaAuth,
        name: 'supporter_upsert',
        description: 'Upsert Supporter based on Email',
        displayName: 'Upsert Supporter on Email',
        props: {
            baseUrl: salsaCommon.baseUrl,
            supporters: Property.Json({
                displayName: "Supporters (JSON Array)",
                description: "The Supporters JSON Array",
                required: true
            })
        },
        async run({auth, propsValue}) {
            return await upsertSupporter(auth, propsValue);
        },
});
