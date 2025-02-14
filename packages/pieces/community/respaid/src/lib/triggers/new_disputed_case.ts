
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { respaidAuth } from '../../index';
import { respaidTriggersCommon } from '../common';


interface NewDisputedCaseTriggerPayload {
    unique_identifier?: string;
    name?: string;
    company_name?: string;
    email?: string;
    phone_number?: string;
    invoice_number?: string;
    amount?: number;
    currency?: string;
    context?: string;
    attachment?: string;
}

export const newDisputedCase = createTrigger({
    name: 'new_disputed_case',
    displayName: 'New Disputed Case',
    description: "Triggers when a collection process was disputed by the debtor.",
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
        "context": "Q: In order to stop the proceedings against you and not increase the amount of the debt, we can offer you\n" +
            "A: Payment in instalments of up to 5 months (activation of instalments within 1 working day).\n" +
            "Q: Do you agree to sign the following mandate?\n" +
            "A: I agree",
        "attachment": "https://link_excel.com/"
    },
    type: TriggerStrategy.WEBHOOK,
    onEnable: respaidTriggersCommon.onEnable('new_disputed_case'),
    onDisable: respaidTriggersCommon.onDisable('new_disputed_case'),
    async run(context) {
        const payload = respaidTriggersCommon.getPayload(context);
        return [payload as NewDisputedCaseTriggerPayload];
    },
})