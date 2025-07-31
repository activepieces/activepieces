import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import {
    campaignIdProp,
    emailsProp,
    leadIdsDropdownProp,
} from '../common/props';

const MAX_EMAILS = 50;
const MAX_LEAD_IDS = 50;

export const addRecipientsAction = createAction({
    auth: hunterAuth,
    name: 'add-recipients',
    displayName: 'Add Recipients',
    description: 'Add one or multiple recipients to a campaign.',
    props: {
        campaign_id: campaignIdProp,
        emails: emailsProp,
        lead_ids: leadIdsDropdownProp,
    },
    async run(context) {
        const {
            campaign_id,
            emails: rawEmails = [],
            lead_ids: rawLeadIds = [],
        } = context.propsValue as {
            campaign_id: number;
            emails?: unknown[];
            lead_ids?: unknown[];
        };

        const stringEmails = rawEmails.filter(
            (e): e is string => typeof e === 'string'
        );
        const numberLeadIds = rawLeadIds.filter(
            (id): id is number => typeof id === 'number'
        );

        const filteredEmails = stringEmails
            .map((e) => e.trim())
            .filter((e) => e.length > 0);

        if (filteredEmails.length === 0 && numberLeadIds.length === 0) {
            throw new Error(
                'You must provide at least one valid email or one lead ID.'
            );
        }

        if (filteredEmails.length > MAX_EMAILS) {
            throw new Error(`You can add at most ${MAX_EMAILS} emails at once.`);
        }
        if (numberLeadIds.length > MAX_LEAD_IDS) {
            throw new Error(`You can add at most ${MAX_LEAD_IDS} lead IDs at once.`);
        }

        const body: { emails?: string[]; lead_ids?: number[] } = {};
        if (filteredEmails.length) body.emails = filteredEmails;
        if (numberLeadIds.length) body.lead_ids = numberLeadIds;

        const resp = await hunterApiCall({
            apiKey: context.auth,
            endpoint: `/campaigns/${campaign_id}/recipients`,
            method: HttpMethod.POST,
            body,
        }) as {
            data: {
                recipients_added: number;
                skipped_recipients: Array<{
                    email: string;
                    reason:
                    | 'duplicate'
                    | 'invalid'
                    | 'removed'
                    | 'bounced'
                    | 'unsubscribed'
                    | 'claimed';
                }>;
            };
        };

        return {
            recipients_added: resp.data.recipients_added,
            skipped_recipients: resp.data.skipped_recipients,
        };
    },
});
