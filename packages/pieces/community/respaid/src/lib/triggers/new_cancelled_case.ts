
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { respaidAuth } from '../../index';
import { respaidTriggersCommon } from '../common';

interface NewCancelledCaseTriggerPayload {
    unique_identifier?: string;
    name?: string;
    company_name?: string;
    email?: string;
    phone_number?: string;
    invoice_number?: string;
    amount?: number;
    currency?: string;
    reason?: string;
}
  

export const newCancelledCase = createTrigger({
    name: 'new_cancelled_case',
    displayName: 'New Cancelled Case',
    description: "Triggers when a collection process for a given sequence (case) was cancelled.",
    auth: respaidAuth,
    props: {},
    sampleData: {
        "unique_identifier": "123",
        "name": "John Doe",
        "company_name": "Company XYZ",
        "email": "john@example.com",
        "phone_number": "1234567890",
        "invoice_number": "INV123",
        "amount": 1000,
        "currency": "usd",
        "reason": "Issue with invoice"
    },
    type: TriggerStrategy.WEBHOOK,
    onEnable: respaidTriggersCommon.onEnable('new_cancelled_case'),
    onDisable: respaidTriggersCommon.onDisable('new_cancelled_case'),
    async run(context) {
        const payload = respaidTriggersCommon.getPayload(context);
        return [payload as NewCancelledCaseTriggerPayload];
    },
})