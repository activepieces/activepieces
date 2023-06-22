import { createAction, Property } from '@activepieces/pieces-framework';
import { salsaCommon } from '../common/common';
import { upsertOfflineDonation } from './offline-donation';

export const salsaOfflineDonationUpsert = createAction({
    name: 'offline_donation_upsert',
    description: 'Upsert Offline Donation',
    displayName: 'Upsert Offline Donation',
    props: {
        authentication: salsaCommon.authentication,
        offlineDontions: Property.Json({
            displayName: "Offline Donation (JSON Array)",
            description: "The Offline Donation JSON Array",
            required: true
        })
    },
    async run(context) {
        return await upsertOfflineDonation(context.propsValue['offlineDontions']);
    },
});