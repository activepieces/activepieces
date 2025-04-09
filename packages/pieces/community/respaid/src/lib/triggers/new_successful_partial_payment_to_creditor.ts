import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework'
import { respaidAuth } from '../../index'
import { respaidTriggersCommon } from '../common'

interface NewPaidTriggerPayload {
  unique_identifier?: string
  name?: string
  company_name?: string
  email?: string
  phone_number?: string
  invoice_number?: string
  amount?: number
  paid_amount?: number
  balance?: number
  currency?: string
  paid_at?: string
}

export const newSuccessfulPartialPaymentToCreditor = createTrigger({
  name: 'new_successful_partial_payment_to_creditor',
  displayName: 'New Successful Partial Payment to Creditor',
  description: 'Triggers when the debt is partially paid directly to the creditor.',
  auth: respaidAuth,
  props: {},
  sampleData: {
    unique_identifier: '123',
    name: 'John Doe',
    company_name: 'Company XYZ',
    email: 'john@example.com',
    phone_number: '1234567890',
    invoice_number: 'INV123',
    amount: 1000,
    paid_amount: 250,
    balance: 750,
    currency: 'usd',
    paid_at: '2025-03-02T00:00:00+0000',
  },
  type: TriggerStrategy.WEBHOOK,
  onEnable: respaidTriggersCommon.onEnable('new_successful_partial_payment_to_creditor'),
  onDisable: respaidTriggersCommon.onDisable('new_successful_partial_payment_to_creditor'),
  async run(context) {
    const payload = respaidTriggersCommon.getPayload(context)
    return [payload as NewPaidTriggerPayload]
  },
})
