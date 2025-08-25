import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const findCampaign = createAction({
    auth: mailchimpAuth,
    name: 'find_campaign',
    displayName: 'Find Campaign',
    description: 'Finds an existing campaign.',
    props: {
        campaign_id: Property.Dropdown({
            displayName: 'Campaign',
            description: 'The campaign to find. The 100 most recent campaigns are listed.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your Mailchimp account first.',
                    };
                }

                const authProp = auth as OAuth2PropertyValue;
                const accessToken = authProp.access_token;
                const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
                
                mailchimp.setConfig({
                    accessToken: accessToken,
                    server: serverPrefix,
                });

                // The SDK types are incomplete, so we cast to 'any'.
                const response = await (mailchimp as any).campaigns.list({
                    count: 100,
                    sort_field: 'create_time',
                    sort_dir: 'DESC',
                    fields: ['campaigns.id', 'campaigns.settings.title']
                });

                const options = response.campaigns.map((campaign: { id: string; settings: { title: string } }) => ({
                    label: campaign.settings.title,
                    value: campaign.id,
                }));

                return {
                    disabled: false,
                    options: options,
                };
            }
        })
    },
    async run(context) {
        const { campaign_id } = context.propsValue;
        const accessToken = context.auth.access_token;
        const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

        mailchimp.setConfig({
            accessToken: accessToken,
            server: serverPrefix,
        });

        // The SDK types are incomplete, so we cast to 'any'.
        return await (mailchimp as any).campaigns.get(campaign_id);
    },
});