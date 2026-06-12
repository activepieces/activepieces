import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountSubscriptionRenewalExtendedTrigger = createManualWebhookTrigger({
  name: 'account_subscription_renewal_extended',
  displayName: 'Account Subscription Renewal Extended',
  description: 'Triggers when a subscription renewal is extended for an account in Outseta.',
  aiMetadata: {
    description:
      "Fires when an account's subscription renewal date is extended in Outseta, delivering the account with its subscription and the new renewal date.",
  },
  sampleData: {
    Name: 'Acme Corp',
    IsDemo: false,
    AccountStage: 3,
    AccountStageLabel: 'Subscribing',
    CurrentSubscription: {
      BillingRenewalTerm: 1,
      Plan: {
        Name: 'Professional',
        PlanFamily: { Name: 'Main Plans', Uid: 'pf_example1', _objectType: 'PlanFamily' },
        MonthlyRate: 49.00,
        IsActive: true,
        Uid: 'plan_example1',
        _objectType: 'Plan',
      },
      StartDate: '2024-02-01T00:00:00',
      RenewalDate: '2024-05-01T00:00:00',
      SubscriptionAddOns: [],
      Rate: 49.00,
      Uid: 'sub_example1',
      _objectType: 'Subscription',
    },
    HasLoggedIn: true,
    LifetimeRevenue: 147.00,
    Uid: 'acc_example1',
    _objectType: 'Account',
    Created: '2024-01-15T10:00:00',
    Updated: '2024-04-01T00:00:00',
  },
});
