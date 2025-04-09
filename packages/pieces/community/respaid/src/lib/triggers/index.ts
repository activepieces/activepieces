import { newCampaignCreation } from './new_campaign_creation'
import { newCancelledCase } from './new_cancelled_case'
import { newDisputedCase } from './new_disputed_case'
import { newPayout } from './new_payout'
import { newSuccessfulCollectionPaidToCreditor } from './new_successful_collection_paid_to_creditor'
import { newSuccessfulCollectionViaLegalOfficer } from './new_successful_collection_via_legal_officer'
import { newSuccessfulCollectionViaRespaid } from './new_successful_collection_via_respaid'
import { newSuccessfulInstallmentPaymentViaRespaid } from './new_successful_installment_payment_via_respaid'
import { newSuccessfulPartialPaymentToCreditor } from './new_successful_partial_payment_to_creditor'
import { newSuccessfulPartialPaymentViaRespaid } from './new_successful_partial_payment_via_respaid'

export const respaidTriggers = [
  newCampaignCreation,
  newCancelledCase,
  newDisputedCase,
  newPayout,
  newSuccessfulCollectionPaidToCreditor,
  newSuccessfulInstallmentPaymentViaRespaid,
  newSuccessfulCollectionViaLegalOfficer,
  newSuccessfulPartialPaymentToCreditor,
  newSuccessfulPartialPaymentViaRespaid,
  newSuccessfulCollectionViaRespaid,
]
