import { createAction, Property } from '@activepieces/pieces-framework';
import { salsaCommon } from '../common/common';
import { salsaAuth } from '../..';
import { upsertOfflineDonation } from './offline-donation';

export const salsaOfflineDonationUpsert = createAction({
    auth: salsaAuth,
        name: 'offline_donation_upsert',
        description: 'Upsert Offline Donation based on Email',
        displayName: 'Upsert Offline Donation',
        props: {
            baseUrl: salsaCommon.baseUrl,
            donations: Property.Json({
                displayName: "Offline Donation (JSON Array)",
                description: "The Offline Donation JSON Array",
                required: true
            })
        },
        async run({auth, propsValue}) {
            return await upsertOfflineDonation(auth, propsValue);
        },
});
