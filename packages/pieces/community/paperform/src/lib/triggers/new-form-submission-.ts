import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { Property } from '@activepieces/pieces-framework';

export const newFormSubmission = createTrigger({
    auth: paperformAuth,
    name: 'new_form_submission',
    displayName: 'New Form Submission',
    description: 'Fires when a completed form submission is received.',
    props: {
        formId: Property.Dropdown({
            displayName: 'Form',
            description: 'Select the form to monitor for submissions',
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
            "title": "How many items do you need serviced?",
            "description": null,
            "type": "number",
            "key": "4ud3u",
            "custom_key": null,
            "value": "12"
          },
          {
            "title": "What model/s are they?",
            "description": null,
            "type": "text",
            "key": "fpqh3",
            "custom_key": null,
            "value": "123"
          },
          {
            "title": "Please note the serial numbers if applicable",
            "description": "seperate serial numbers with a comma",
            "type": "text",
            "key": "1q9kp",
            "custom_key": null,
            "value": null
          },
          {
            "title": "Would you like any extras?",
            "description": null,
            "type": "choices",
            "key": "839ur",
            "custom_key": null,
            "value": []
          },
          {
            "title": "What's your name?",
            "description": null,
            "type": "text",
            "key": "1dknr",
            "custom_key": null,
            "value": "adf"
          },
          {
            "title": "What's your email?",
            "description": null,
            "type": "email",
            "key": "678jb",
            "custom_key": null,
            "value": "asdf@gmail.com"
          },
          {
            "title": "What's your phone number?",
            "description": "optional",
            "type": "phone",
            "key": "961vo",
            "custom_key": null,
            "value": "23123123"
          },
          {
            "title": "What's your zip code?",
            "description": "Additional cost of $5 per mile after the first 20 miles from our location",
            "type": "number",
            "key": "cqdek",
            "custom_key": null,
            "value": "123123"
          },
          {
            "title": "Please tell us about any access difficulties...",
            "description": "$50-$100 surcharge for stairs, obstacles, long distances from parking, \nor other risky conditions that increase our liability",
            "type": "text",
            "key": "7j84i",
            "custom_key": null,
            "value": null
          },
          {
            "title": "What contact method is better for you?",
            "description": "We'll try to get back to you in 1 - 2 days",
            "type": "choices",
            "key": "66dcl",
            "custom_key": null,
            "value": []
          },
          {
            "title": "When would you like us to come?",
            "description": "",
            "type": "date",
            "key": "1mbr3",
            "custom_key": null,
            "value": null
          },
          {
            "title": "What time?",
            "description": "",
            "type": "choices",
            "key": "838hl",
            "custom_key": null,
            "value": []
          },
          {
            "title": "Are you interested in a regular service contract?",
            "description": "We offer discounts for regular services",
            "type": "yesNo",
            "key": "9telv",
            "custom_key": null,
            "value": null
          },
          {
            "title": "If you have any pictures...",
            "description": "This will help us determine your needs",
            "type": "image",
            "key": "brnrs",
            "custom_key": null,
            "value": null
          },
          {
            "title": "Anything else you want to tell us?",
            "description": null,
            "type": "text",
            "key": "2290b",
            "custom_key": null,
            "value": null
          }
        ],
        "form_id": "688bacd0fa782232f70c0259",
        "slug": "gb9eqipt",
        "submission_id": "688bb90191018dd3500e83ef",
        "created_at": "2025-07-31 18:42:09",
        "ip_address": "192.168.1.1",
        "charge": {
          "products": [],
          "summary": "",
          "discount": 0,
          "discounted_subscriptions": [],
          "coupon": false,
          "total": 0,
          "total_cents": 0,
          "tax": 0,
          "tax_percentage": 0,
          "processing_fee": 0,
          "authorize": null,
          "receipt_email": false
        },
        "team_id": 486218,
        "trigger": "submission",
        "device": {
          "type": "desktop",
          "device": "WebKit",
          "platform": "Linux",
          "browser": "Chrome",
          "embedded": false,
          "url": "https://gb9eqipt.paperform.co/",
          "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
          "utm_source": null,
          "utm_medium": null,
          "utm_campaign": null,
          "utm_term": null,
          "utm_content": null,
          "ip_address": "192.168.1.1"
        }
      },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const formId = context.propsValue.formId;
        const response = await paperformCommon.createWebhook({
            formId,
            webhookUrl: context.webhookUrl,
            auth: context.auth,
            eventType: 'submission',
        });
        
        await context.store.put('new_form_submission_webhook_id', response.id);
    },
    async onDisable(context) {
        const webhookId = await context.store.get<string>('new_form_submission_webhook_id');
        if (webhookId) {
            await paperformCommon.deleteWebhook({
                webhookId,
                auth: context.auth,
            });
            await context.store.put('new_form_submission_webhook_id', null);
        }
    },
    async run(context) {
        const payload = context.payload.body as any;
        return [payload];
    }
});
