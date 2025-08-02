import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { Property } from '@activepieces/pieces-framework';

export const newPartialFormSubmission = createTrigger({
    auth: paperformAuth,
    name: 'new_partial_form_submission',
    displayName: 'New Partial Form Submission',
    description: 'Fires when a partial/in-progress submission is received.',
    props: {
        formId: Property.Dropdown({
            displayName: 'Form',
            description: 'Select the form to monitor for partial submissions',
            required: true,
            refreshers: ['auth'],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                
                try {
                    const forms = await paperformCommon.getForms({
                        auth: auth as string,
                        limit: 100,
                    });
                    
                    return {
                        disabled: false,
                        options: forms.results.forms.map((form) => ({
                            label: form.title,
                            value: form.id,
                        })),
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        placeholder: 'Error loading forms',
                        options: [],
                    };
                }
            },
        }),
    },
    sampleData: {
        "data": [
          {
            "title": "Title of your review",
            "description": "",
            "type": "text",
            "key": "9ujar",
            "custom_key": null,
            "value": null
          },
          {
            "title": "Overall Rating",
            "description": "",
            "type": "choices",
            "key": "are78",
            "custom_key": null,
            "value": null
          },
          {
            "title": "Pros: What do you like most about this product? ",
            "description": "(75 characters minimum)",
            "type": "text",
            "key": "9rarq",
            "custom_key": null,
            "value": null
          },
          {
            "title": "Cons: What do you like least about this product? ",
            "description": "(75 characters minimum)",
            "type": "text",
            "key": "f9ast",
            "custom_key": null,
            "value": null
          },
          {
            "title": "If you had a magic wand and could change or improve one thing about the product, what would it be?",
            "description": null,
            "type": "text",
            "key": "fl8lh",
            "custom_key": null,
            "value": null
          },
          {
            "title": "Ease of Use",
            "description": "(1⭐️=bad, 5⭐️=excellent)",
            "type": "choices",
            "key": "fjd8s",
            "custom_key": null,
            "value": null
          },
          {
            "title": "Value for Money/ROI",
            "description": "(1⭐️=bad, 5⭐️=excellent)",
            "type": "choices",
            "key": "2geub",
            "custom_key": null,
            "value": null
          },
          {
            "title": "Customer Support",
            "description": "(1⭐️=bad, 5⭐️=excellent)",
            "type": "choices",
            "key": "fpkaq",
            "custom_key": null,
            "value": null
          },
          {
            "title": "Implementation/Onboarding",
            "description": "(1⭐️=bad, 5⭐️=excellent)",
            "type": "choices",
            "key": "2ublr",
            "custom_key": null,
            "value": null
          },
          {
            "title": "How likely are you to recommend this product to a colleague or friend?",
            "description": null,
            "type": "scale",
            "key": "e2fo2",
            "custom_key": null,
            "value": null
          }
        ],
        "form_id": "688bbc42ecb46418a40e73af",
        "slug": "u6blildp",
        "submission_id": null,
        "created_at": null,
        "ip_address": null,
        "charge": null,
        "team_id": 486218
      },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const formId = context.propsValue.formId;
        const response = await paperformCommon.createWebhook({
            formId,
            webhookUrl: context.webhookUrl,
            auth: context.auth,
            eventType: 'partial_submission',
        });
        
        await context.store.put('new_partial_form_submission_webhook_id', response.id);
    },
    async onDisable(context) {
        const webhookId = await context.store.get<string>('new_partial_form_submission_webhook_id');
        if (webhookId) {
            await paperformCommon.deleteWebhook({
                webhookId,
                auth: context.auth,
            });
            await context.store.put('new_partial_form_submission_webhook_id', null);
        }
    },
    async run(context) {
        const payload = context.payload.body as any;
        return [payload];
    }
});
