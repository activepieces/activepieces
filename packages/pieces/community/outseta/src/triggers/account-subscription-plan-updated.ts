import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountSubscriptionPlanUpdatedTrigger = createManualWebhookTrigger({
  name: 'account_subscription_plan_updated',
  displayName: 'Account Subscription Plan Updated',
  description: 'Triggers when an account\'s subscription plan is changed in Outseta.',
  sampleData: {
    Name: 'Acme Corp',
    IsDemo: false,
    AccountStage: 3,
    AccountStageLabel: 'Subscribing',
    CurrentSubscription: {
      BillingRenewalTerm: 1,
      Plan: {
        Name: 'Enterprise',
        PlanFamily: { Name: 'Main Plans', Uid: 'pf_example1', _objectType: 'PlanFamily' },
        MonthlyRate: 99.00,
        AnnualRate: 990.00,
        IsActive: true,
        Uid: 'plan_example2',
        _objectType: 'Plan',
      },
      StartDate: '2024-03-01T00:00:00',
      RenewalDate: '2024-04-01T00:00:00',
      SubscriptionAddOns: [],
      Rate: 99.00,
      Uid: 'sub_example2',
      _objectType: 'Subscription',
      Created: '2024-03-01T00:00:00',
      Updated: '2024-03-01T00:00:00',
    },
    ActivityEventData: {
      CurrentSubscription: {
        Plan: {
          Name: 'Professional',
          MonthlyRate: 49.00,
          Uid: 'plan_example1',
          _objectType: 'Plan',
        },
        Rate: 49.00,
        Uid: 'sub_example1',
        _objectType: 'Subscription',
      },
      Uid: 'acc_example1',
      _objectType: 'Account',
    },
    HasLoggedIn: true,
    LifetimeRevenue: 98.00,
    Uid: 'acc_example1',
    _objectType: 'Account',
    Created: '2024-01-15T10:00:00',
    Updated: '2024-03-01T00:00:00',
  },
});
