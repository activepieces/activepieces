import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { deftformAuth } from '../auth';
import { deftformApiCall, DeftformCommon } from '../common';

export const updateFormSettings = createAction({
    auth: deftformAuth,
    name: 'update_form_settings',
    displayName: 'Update Form Settings',
    description: 'Updates any combination of form settings via a single call — from title and status to integrations, SEO, and security.',
    props: {
        formId: DeftformCommon.formDropdown,

        generalHeader: Property.MarkDown({
            value: '## General Settings',
        }),
        name: Property.ShortText({
            displayName: 'Form Name',
            description: 'New display name of the form. Leave empty to keep the current value.',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Form Description',
            description: 'New description shown on the public form page.',
            required: false,
        }),
        isClosed: Property.Checkbox({
            displayName: 'Close Form',
            description: 'When checked, the form stops accepting new submissions.',
            required: false,
        }),
        responsesLimit: Property.Number({
            displayName: 'Responses Limit',
            description: 'Maximum number of submissions allowed. Leave empty for unlimited responses.',
            required: false,
        }),

        afterSubmissionHeader: Property.MarkDown({
            value: '## After-Submission Behaviour',
        }),
        afterMessage: Property.LongText({
            displayName: 'After-Submission Message',
            description: 'Message shown on screen after the user submits the form.',
            required: false,
        }),
        afterRedirectUrl: Property.ShortText({
            displayName: 'After-Submission Redirect URL',
            description: 'URL to redirect the respondent to after submission (instead of showing a message).',
            required: false,
        }),
        afterRedirectDelay: Property.Number({
            displayName: 'Redirect Delay (seconds)',
            description: 'Number of seconds to wait before redirecting. Leave empty for instant redirect.',
            required: false,
        }),
        ctaLabel: Property.ShortText({
            displayName: 'CTA Label',
            description: 'Text on the primary button shown after submission (e.g. "Download").',
            required: false,
        }),
        ctaLabelContinue: Property.ShortText({
            displayName: 'CTA Label Continue',
            description: 'Text on the secondary button shown after submission (e.g. "Next").',
            required: false,
        }),
        closedMessage: Property.LongText({
            displayName: 'Closed Form Message',
            description: 'Message shown when a user tries to access a closed form.',
            required: false,
        }),

        adminEmailHeader: Property.MarkDown({
            value: '## Admin Notification Email',
        }),
        adminEmailSubject: Property.ShortText({
            displayName: 'Notification Email Subject',
            description: 'Subject line of the email sent to admins on each new submission.',
            required: false,
        }),
        adminEmailNote: Property.LongText({
            displayName: 'Notification Email Note',
            description: 'Custom note added to the top of the admin notification email.',
            required: false,
        }),
        adminEmailAttachPdf: Property.Checkbox({
            displayName: 'Attach Submission PDF',
            description: 'Attach a PDF version of the submission to the admin email.',
            required: false,
        }),
        includeResponseInEmail: Property.Checkbox({
            displayName: 'Include Response in Email',
            description: 'Include the full response data in the admin notification body.',
            required: false,
        }),
        afterMessageEmail: Property.LongText({
            displayName: 'Respondent Confirmation Email Message',
            description: 'Message sent to the respondent in their confirmation email (if enabled).',
            required: false,
        }),
        afterMessageEmailSubject: Property.ShortText({
            displayName: 'Respondent Confirmation Email Subject',
            description: 'Subject line of the confirmation email sent to the respondent.',
            required: false,
        }),

        seoHeader: Property.MarkDown({
            value: '## SEO Settings',
        }),
        seoTitle: Property.ShortText({
            displayName: 'SEO Title',
            description: 'Custom HTML title tag for the public form page.',
            required: false,
        }),
        seoDescription: Property.ShortText({
            displayName: 'SEO Description',
            description: 'Meta description for the public form page.',
            required: false,
        }),
        seoAllowBots: Property.Checkbox({
            displayName: 'Allow Search-Engine Bots',
            description: 'When checked, search engines may index the public form page.',
            required: false,
        }),

        integrationsHeader: Property.MarkDown({
            value: '## Integrations',
        }),
        discordEnabled: Property.Checkbox({
            displayName: 'Discord Notifications',
            description: 'When checked, a notification is sent to the configured Discord channel on each submission.',
            required: false,
        }),
        slackEnabled: Property.Checkbox({
            displayName: 'Slack Notifications',
            description: 'When checked, a notification is sent to the configured Slack channel on each submission.',
            required: false,
        }),
        googleSheetsEnabled: Property.Checkbox({
            displayName: 'Google Sheets Integration',
            description: 'When checked, submissions are automatically synced to Google Sheets.',
            required: false,
        }),
        hubspotEnabled: Property.Checkbox({
            displayName: 'HubSpot Integration',
            description: 'When checked, submissions are pushed to HubSpot as contacts or deals.',
            required: false,
        }),

        securityHeader: Property.MarkDown({
            value: '## Security',
        }),
        captcha: Property.StaticDropdown({
            displayName: 'CAPTCHA',
            description: 'Protection against spam bots.',
            required: false,
            options: {
                options: [
                    { label: 'ALTCHA', value: 'altcha' },
                    { label: 'Turnstile (Cloudflare)', value: 'turnstile' },
                    { label: 'reCAPTCHA', value: 'recaptcha' },
                    { label: 'None', value: 'none' },
                ],
            },
        }),
        captureLocation: Property.Checkbox({
            displayName: 'Capture Location',
            description: 'Record the respondent location (IP-based geolocation).',
            required: false,
        }),

        layoutHeader: Property.MarkDown({
            value: '## Layout & Display',
        }),
        showFormTitle: Property.Checkbox({
            displayName: 'Show Form Title',
            description: 'Display the form title at the top of the public page.',
            required: false,
        }),
        showMultipageProgress: Property.Checkbox({
            displayName: 'Show Multi-Page Progress',
            description: 'Show a progress bar when the form has multiple pages.',
            required: false,
        }),
        aiSummaryEnabled: Property.Checkbox({
            displayName: 'AI Summary',
            description: 'Enable the AI-powered summary on the form dashboard.',
            required: false,
        }),
        sendPdfToRespondent: Property.Checkbox({
            displayName: 'Send PDF to Respondent',
            description: 'Attach a PDF version of the submission to the respondent confirmation email.',
            required: false,
        }),

        numberHeader: Property.MarkDown({
            value: '## Submission Numbering',
        }),
        numberPrefix: Property.ShortText({
            displayName: 'Number Prefix',
            description: 'Text added before the submission number (e.g. "INV-").',
            required: false,
        }),
        numberSuffix: Property.ShortText({
            displayName: 'Number Suffix',
            description: 'Text added after the submission number (e.g. "-A").',
            required: false,
        }),
    },
    async run(context) {
        const body: any = {};

        if (context.propsValue.name !== undefined) body.name = context.propsValue.name;
        if (context.propsValue.description !== undefined) body.description = context.propsValue.description;
        if (context.propsValue.isClosed !== undefined) body.is_closed = context.propsValue.isClosed;
        if (context.propsValue.responsesLimit !== undefined) body.responses_limit = context.propsValue.responsesLimit;
        if (context.propsValue.afterMessage !== undefined) body.after_message = context.propsValue.afterMessage;
        if (context.propsValue.afterRedirectUrl !== undefined) body.after_redirect_url = context.propsValue.afterRedirectUrl;
        if (context.propsValue.afterRedirectDelay !== undefined) body.after_redirect_delay = context.propsValue.afterRedirectDelay;
        if (context.propsValue.ctaLabel !== undefined) body.cta_label = context.propsValue.ctaLabel;
        if (context.propsValue.ctaLabelContinue !== undefined) body.cta_label_continue = context.propsValue.ctaLabelContinue;
        if (context.propsValue.closedMessage !== undefined) body.closed_message = context.propsValue.closedMessage;
        if (context.propsValue.adminEmailSubject !== undefined) body.admin_email_subject = context.propsValue.adminEmailSubject;
        if (context.propsValue.adminEmailNote !== undefined) body.admin_email_note = context.propsValue.adminEmailNote;
        if (context.propsValue.adminEmailAttachPdf !== undefined) body.admin_email_attach_pdf = context.propsValue.adminEmailAttachPdf;
        if (context.propsValue.includeResponseInEmail !== undefined) body.include_response_in_email = context.propsValue.includeResponseInEmail;
        if (context.propsValue.afterMessageEmail !== undefined) body.after_message_email = context.propsValue.afterMessageEmail;
        if (context.propsValue.afterMessageEmailSubject !== undefined) body.after_message_email_subject = context.propsValue.afterMessageEmailSubject;
        if (context.propsValue.seoTitle !== undefined) body.seo_title = context.propsValue.seoTitle;
        if (context.propsValue.seoDescription !== undefined) body.seo_description = context.propsValue.seoDescription;
        if (context.propsValue.seoAllowBots !== undefined) body.seo_allow_bots = context.propsValue.seoAllowBots;
        if (context.propsValue.discordEnabled !== undefined) body.discord_enabled = context.propsValue.discordEnabled;
        if (context.propsValue.slackEnabled !== undefined) body.slack_enabled = context.propsValue.slackEnabled;
        if (context.propsValue.googleSheetsEnabled !== undefined) body.google_sheets_enabled = context.propsValue.googleSheetsEnabled;
        if (context.propsValue.hubspotEnabled !== undefined) body.hubspot_enabled = context.propsValue.hubspotEnabled;
        if (context.propsValue.captcha !== undefined) body.captcha = context.propsValue.captcha;
        if (context.propsValue.captureLocation !== undefined) body.capture_location = context.propsValue.captureLocation;
        if (context.propsValue.showFormTitle !== undefined) body.show_formtitle = context.propsValue.showFormTitle;
        if (context.propsValue.showMultipageProgress !== undefined) body.show_multipage_progress = context.propsValue.showMultipageProgress;
        if (context.propsValue.aiSummaryEnabled !== undefined) body.ai_summary_enabled = context.propsValue.aiSummaryEnabled;
        if (context.propsValue.sendPdfToRespondent !== undefined) body.send_pdf_to_respondent = context.propsValue.sendPdfToRespondent;
        if (context.propsValue.numberPrefix !== undefined) body.number_prefix = context.propsValue.numberPrefix;
        if (context.propsValue.numberSuffix !== undefined) body.number_suffix = context.propsValue.numberSuffix;

        const response = await deftformApiCall<{
            data?: {
                id?: string;
                name?: string;
                updated_at?: string;
            };
        }>({
            token: context.auth.secret_text,
            method: HttpMethod.POST,
            path: `/forms/${context.propsValue.formId}/settings`,
            body,
        });

        return {
            id: response.body.data?.id ?? null,
            name: response.body.data?.name ?? null,
            updated_at: response.body.data?.updated_at ?? null,
        };
    },
});
