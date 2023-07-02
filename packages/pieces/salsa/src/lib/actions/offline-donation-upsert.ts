import { createAction, Property } from '@activepieces/pieces-framework';
import { salsaCommon } from '../common/common';
import { upsertOfflineDonation } from './offline-donation';

export const salsaOfflineDonationUpsert = createAction({
    name: 'offline_donation_upsert',
    description: 'Upsert Offline Donation based on Email',
    displayName: 'Upsert Offline Donation',
    props: {
        authentication: salsaCommon.authentication,
        baseUrl: salsaCommon.baseUrl,
        donations: Property.Json({
            displayName: "Offline Donation (JSON Array)",
            description: "The Offline Donation JSON Array",
            required: true
        })
    },
    async run(context) {
        return await upsertOfflineDonation(context.propsValue);
    },
});