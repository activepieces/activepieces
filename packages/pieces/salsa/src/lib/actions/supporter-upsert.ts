import { createAction, Property } from '@activepieces/pieces-framework';
import { salsaCommon } from '../common/common';
import { upsertSupporter } from './supporter';

export const salsaSupporterUpsert = createAction({
    name: 'supporter_upsert',
    description: 'Upsert Supporter based on Email',
    displayName: 'Upsert Supporter on Email',
    props: {
        authentication: salsaCommon.authentication,
        supporters: Property.Json({
            displayName: "Contact (JSON Array)",
            description: "The Contact JSON Array",
            required: true
        })
    },
    async run(context) {
        return await upsertSupporter(context.propsValue['supporters']);
    },
});