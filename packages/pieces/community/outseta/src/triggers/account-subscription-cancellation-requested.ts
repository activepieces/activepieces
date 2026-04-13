import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountSubscriptionCancellationRequestedTrigger = createManualWebhookTrigger({
  name: 'account_subscription_cancellation_requested',
  displayName: 'Account Subscription Cancellation Requested',
  description: 'Triggers when a subscription cancellation is requested for an account in Outseta.',
  sampleData: {
    Name: 'Acme Corp',
    IsDemo: false,
    AccountStage: 4,
    AccountStageLabel: 'Canceling',
    PersonAccount: [
      {
        Person: {
          Email: 'jane.doe@example.com',
          FirstName: 'Jane',
          LastName: 'Doe',
          FullName: 'Jane Doe',
          Uid: 'per_example1',
          _objectType: 'Person',
        },
        IsPrimary: true,
        Uid: 'pa_example1',
        _objectType: 'PersonAccount',
      },
    ],
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
      EndDate: '2024-04-01T00:00:00',
      Rate: 49.00,
      Uid: 'sub_example1',
      _objectType: 'Subscription',
    },
    HasLoggedIn: true,
    LifetimeRevenue: 98.00,
    Uid: 'acc_example1',
    _objectType: 'Account',
    Created: '2024-01-15T10:00:00',
    Updated: '2024-03-15T00:00:00',
  },
});
