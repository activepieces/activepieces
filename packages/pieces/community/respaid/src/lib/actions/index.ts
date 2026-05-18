import { createNewCampaign } from "./create_new_campaign";
import { stopCollectionClientPaidDirectly } from "./stop_collection_client_paid_directly";
import { stopCollectionForDirectInstalmentPayment } from "./stop_collection_for_direct_instalment_payment";
import { stopCollectionForDirectPartialPayment } from "./stop_collection_for_direct_partial_payment";

export const respaidActions = [
    createNewCampaign,
    stopCollectionClientPaidDirectly,
    stopCollectionForDirectPartialPayment,
    stopCollectionForDirectInstalmentPayment
]