import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountStageUpdatedTrigger = createManualWebhookTrigger({
  name: 'account_stage_updated',
  displayName: 'Account Stage Updated',
  description: 'Triggers when an account\'s stage changes in Outseta (e.g. Trialing → Subscribing).',
  sampleData: {
    Name: 'Acme Corp',
    IsDemo: false,
    AccountStage: 3,
    AccountStageLabel: 'Subscribing',
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
        AnnualRate: 490.00,
        IsActive: true,
        Uid: 'plan_example1',
        _objectType: 'Plan',
      },
      StartDate: '2024-02-01T00:00:00',
      Rate: 49.00,
      Uid: 'sub_example1',
      _objectType: 'Subscription',
    },
    HasLoggedIn: true,
    LifetimeRevenue: 49.00,
    ActivityEventData: {
      AccountStage: 2,
      AccountStageLabel: 'Trialing',
      Uid: 'acc_example1',
      _objectType: 'Account',
    },
    Uid: 'acc_example1',
    _objectType: 'Account',
    Created: '2024-01-15T10:00:00',
    Updated: '2024-02-01T10:00:00',
  },
});
