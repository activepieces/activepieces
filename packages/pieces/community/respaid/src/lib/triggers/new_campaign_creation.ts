
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { respaidAuth } from '../../index';
import { respaidTriggersCommon } from '../common';

interface NewCampaignTriggerPayload {
    request_id?: string;
    is_campaign_created?: boolean;
    valid_files?: {
        unique_identifier: string;
        sequence_code: string;
    }[];
    invalid_files?: {
        invalid_email: Record<string, string>;
    }[];
    file_processing_report?: string;
}

export const newCampaignCreation = createTrigger({
    name: 'new_campaign_creation',
    displayName: 'New Campaign Creation Result',
    description: "Triggers when the campaign is created.",
    auth: respaidAuth,
    props: {},
    sampleData: {
        "request_id": "1234",
        "is_campaign_created": true,
        "valid_files": [{
            "unique_identifier": "1",
            "sequence_code": 'SQ###1'
        }, {
            "unique_identifier": "2",
            "sequence_code": 'SQ###2'
        }],
        "invalid_files": [{
            "invalid_email": {
                "unique_identifier_3": "3",
                "unique_identifier_4": "4"
            }
        }],
        "file_processing_report": 'https://link_excel.com'
    },
    type: TriggerStrategy.WEBHOOK,
    onEnable: respaidTriggersCommon.onEnable('new_campaign_creation'),
    onDisable: respaidTriggersCommon.onDisable('new_campaign_creation'),
    async run(context) {
        const payload = respaidTriggersCommon.getPayload(context);
        return [payload as NewCampaignTriggerPayload];
    },
})