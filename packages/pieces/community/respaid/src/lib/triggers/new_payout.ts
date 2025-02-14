
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { respaidAuth } from '../../index';
import { respaidTriggersCommon } from '../common';

type Payment = Partial<{
    reference: string;
    unique_identifier: string;
    name: string;
    company_name: string;
    email: string;
    phone_number: string;
    invoice_number: string;
    amount: number;
    fees: number;
    currency: string;
    paid_at: string;
}>

type PayoutTriggerPayload = Partial<{
    date: string;
    payout_id: string;
    payments: Payment[];
}>

export const newPayout = createTrigger({
    name: 'new_payout',
    displayName: 'New Payout',
    description: "Triggers when a payout is successfully sent to your bank account.",
    auth: respaidAuth,
    props: {},
    sampleData: {
        "payout_id": "1234",
        "date": "2025-03-02T00:00:00+0000",
        "payments": [{
            "reference": "XXX123",
            "unique_identifier": "123",
            "name": "John Doe",
            "company_name": "Company XYZ",
            "email": "john@example.com",
            "phone_number": "1234567890",
            "invoice_number": "INV123",
            "amount": 1000,
            "fees": 2.5,
            "currency": "usd",
            "paid_at": "2025-03-02T00:00:00+0000"
        }]
    },
    type: TriggerStrategy.WEBHOOK,
    onEnable: respaidTriggersCommon.onEnable('new_payout'),
    onDisable: respaidTriggersCommon.onDisable('new_payout'),
    async run(context) {
        const payload = respaidTriggersCommon.getPayload(context);
        return [payload as PayoutTriggerPayload];
    },
})