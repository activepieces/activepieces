import { createManualWebhookTrigger } from './_manual-webhook-trigger';

export const accountSubscriptionAddOnsChangedTrigger = createManualWebhookTrigger({
  name: 'account_subscription_addons_changed',
  displayName: 'Account Subscription Add Ons Changed',
  description: 'Triggers when add-ons are changed on an account\'s subscription in Outseta.',
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
        PlanAddOns: [
          {
            IsUserSelectable: true,
            Uid: 'pa_addon_example1',
            _objectType: 'PlanAddOn',
          },
        ],
        Uid: 'plan_example1',
        _objectType: 'Plan',
      },
      StartDate: '2024-02-01T00:00:00',
      SubscriptionAddOns: [
        {
          AddOn: {
            Name: 'Extra Hours',
            BillingAddOnType: 2,
            MonthlyRate: 5.00,
            UnitOfMeasure: 'hour',
            Uid: 'addon_example1',
            _objectType: 'AddOn',
          },
          Quantity: 10,
          Uid: 'subaddon_example1',
          _objectType: 'SubscriptionAddOn',
        },
      ],
      Rate: 49.00,
      Uid: 'sub_example1',
      _objectType: 'Subscription',
    },
    HasLoggedIn: true,
    Uid: 'acc_example1',
    _objectType: 'Account',
    Created: '2024-01-15T10:00:00',
    Updated: '2024-03-01T00:00:00',
  },
});
