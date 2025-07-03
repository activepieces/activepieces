import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { coasyAuth } from '../..';
import { createCoasyTrigger, destroyCoasyTrigger } from '../common/triggers';

const triggerName = "NEW_AUTH_EVENT";

export const newAuthEvent = createTrigger({
  auth: coasyAuth,
  name: 'newAuthEvent',
  displayName: 'New Auth event',
  description: 'Triggers when an authentication (signUp, password forgotten etc.) event happens',
  props: {
    triggerCategories: Property.StaticMultiSelectDropdown({
      displayName: 'Trigger Categories',
      description: 'categories of trigger',
      required: true,
      options: {
        options: [{
          value: "CustomEmailSender",
          label: "Custom Email Sender"
        }, {
          value: "UserMigration",
          label: "User Migration"
        }, {
          value: "DefineAuthChallenge",
          label: "Define Auth Challenge"
        }, {
          value: "CreateAuthChallenge",
          label: "Create Auth Challenge"
        }, {
          value: "VerifyAuthChallengeResponse",
          label: "Verify Auth Challenge Response"
        }]
      }
    }),
    triggerNames: Property.StaticMultiSelectDropdown({
      displayName: 'Triggers',
      description: 'Select triggers to react on',
      required: true,
      options: {
        options: [{
          value: "SignUp",
          label: "Sign Up"
        }, {
          value: "ResendCode",
          label: "Resend Code"
        }, {
          value: "ForgotPassword",
          label: "Forgot Password"
        }, {
          value: "Authentication",
          label: "Authentication"
        }, {
          value: "ELSE",
          label: "Else"
        }]
      }
    })
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  onEnable : (context) => createCoasyTrigger({
    triggerName,
    webhookUrl: context.webhookUrl,
    auth: context.auth,
    filter: context.propsValue,
    store: context.store
  }),
  onDisable : (context) => destroyCoasyTrigger({
    triggerName,
    auth: context.auth,
    store: context.store
  }),
  async run(context) {
    return [context.payload.body];
  }
});
