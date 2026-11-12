export const outsetaFields = {
  account:
    'fields=*,BillingAddress.*,MailingAddress.*,PrimaryContact.Uid,PrimaryContact.Email,PrimaryContact.FirstName,PrimaryContact.LastName,CurrentSubscription.Uid,CurrentSubscription.Plan.Uid,CurrentSubscription.Plan.Name',
  person:
    'fields=*,MailingAddress.*,PersonAccount.IsPrimary,PersonAccount.Role,PersonAccount.Account.Uid,PersonAccount.Account.Name,PersonAccount.Account.AccountStage',
  deal: 'fields=*,DealPipelineStage.Uid,DealPipelineStage.Name,DealPipelineStage.DealPipeline.Uid,DealPipelineStage.DealPipeline.Name,DealPeople.Person.Uid,DealPeople.Person.Email,Account.Uid,Account.Name',
  transaction:
    'fields=*,Account.Uid,Invoice.Uid,Invoice.Number,Invoice.BillingInvoiceStatus',
};
