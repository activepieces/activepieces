import { t } from 'i18next';

import { cn } from '@/lib/utils';

import { PageBand } from './page-band';

export function PiecesShowcase() {
  return (
    <div className="flex-1 border-t bg-muted/30 pb-9 pt-8">
      <PageBand className="flex flex-col gap-6 px-0 lg:px-0">
        <div className="flex flex-col gap-1.5 px-6 lg:px-14">
          <h2 className="text-[22px] font-bold leading-7 tracking-[-0.02em]">
            {t('Your AI gets all of this')}
          </h2>
          <p className="max-w-[560px] text-sm text-muted-foreground">
            {t(
              'Slack, Gmail, HubSpot, Notion, GitHub and {count}+ more pieces — plus every flow you’ve built, ready to run.',
              { count: PIECES_COUNT },
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 overflow-hidden pl-6 [mask-image:linear-gradient(to_right,#000_88%,transparent)] lg:pl-14">
          <TileRow tiles={TILES.filter((_, index) => index % 2 === 0)} />
          <TileRow
            tiles={TILES.filter((_, index) => index % 2 === 1)}
            className="pl-8"
          />
        </div>
      </PageBand>
    </div>
  );
}

function TileRow({
  tiles,
  className = '',
}: {
  tiles: PieceTile[];
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2.5', className)}>
      {tiles.map((tile) => (
        <span
          key={tile.logo}
          title={tile.displayName}
          className="flex size-[62px] shrink-0 items-center justify-center rounded-xl border bg-background"
        >
          <img
            src={`https://cdn.activepieces.com/pieces/${tile.logo}.png`}
            alt={tile.displayName}
            className="size-8"
          />
        </span>
      ))}
    </div>
  );
}

const PIECES_COUNT = 400;

const TILES: PieceTile[] = [
  { displayName: 'Google Sheets', logo: 'google-sheets' },
  { displayName: 'Slack', logo: 'slack' },
  { displayName: 'Notion', logo: 'notion' },
  { displayName: 'Gmail', logo: 'gmail' },
  { displayName: 'HubSpot', logo: 'hubspot' },
  { displayName: 'OpenAI', logo: 'openai' },
  { displayName: 'Google Forms', logo: 'google-forms' },
  { displayName: 'Google Drive', logo: 'google-drive' },
  { displayName: 'Google Docs', logo: 'google-docs' },
  { displayName: 'GitHub', logo: 'github' },
  { displayName: 'Airtable', logo: 'airtable' },
  { displayName: 'Stripe', logo: 'stripe' },
  { displayName: 'Discord', logo: 'discord' },
  { displayName: 'Telegram', logo: 'telegram_bot' },
  { displayName: 'LinkedIn', logo: 'linkedin' },
  { displayName: 'Salesforce', logo: 'salesforce' },
  { displayName: 'Shopify', logo: 'shopify' },
  { displayName: 'Jira', logo: 'jira' },
  { displayName: 'Google Calendar', logo: 'google-calendar' },
  { displayName: 'Trello', logo: 'trello' },
  { displayName: 'Asana', logo: 'asana' },
  { displayName: 'ClickUp', logo: 'clickup' },
  { displayName: 'monday.com', logo: 'monday' },
  { displayName: 'Zendesk', logo: 'zendesk' },
  { displayName: 'Intercom', logo: 'intercom' },
  { displayName: 'Mailchimp', logo: 'mailchimp' },
  { displayName: 'SendGrid', logo: 'sendgrid' },
  { displayName: 'Twilio', logo: 'twilio' },
  { displayName: 'Dropbox', logo: 'dropbox' },
  { displayName: 'Microsoft Teams', logo: 'microsoft-teams' },
  { displayName: 'Microsoft Excel', logo: 'microsoft-excel-365' },
  { displayName: 'Microsoft Outlook', logo: 'microsoft-outlook' },
  { displayName: 'Todoist', logo: 'todoist' },
  { displayName: 'Zoom', logo: 'zoom' },
  { displayName: 'Calendly', logo: 'calendly' },
  { displayName: 'Typeform', logo: 'typeform' },
  { displayName: 'Webflow', logo: 'webflow' },
  { displayName: 'WordPress', logo: 'wordpress' },
  { displayName: 'Supabase', logo: 'supabase' },
  { displayName: 'MongoDB', logo: 'mongodb' },
  { displayName: 'PostgreSQL', logo: 'postgres' },
  { displayName: 'MySQL', logo: 'mysql' },
  { displayName: 'WhatsApp', logo: 'whatsapp' },
  { displayName: 'Google Gemini', logo: 'google-gemini' },
  { displayName: 'Perplexity AI', logo: 'perplexity-ai' },
  { displayName: 'Apollo', logo: 'apollo' },
  { displayName: 'Attio', logo: 'attio' },
  { displayName: 'Pipedrive', logo: 'pipedrive' },
  { displayName: 'Zoho CRM', logo: 'zoho-crm' },
  { displayName: 'ActiveCampaign', logo: 'activecampaign' },
  { displayName: 'Klaviyo', logo: 'klaviyo' },
  { displayName: 'Customer.io', logo: 'customerio' },
  { displayName: 'Amazon S3', logo: 'amazon-s3' },
  { displayName: 'BambooHR', logo: 'bamboohr' },
  { displayName: 'Freshdesk', logo: 'freshdesk' },
  { displayName: 'GitLab', logo: 'gitlab' },
  { displayName: 'Linear', logo: 'linear' },
  { displayName: 'PagerDuty', logo: 'pagerduty' },
  { displayName: 'Datadog', logo: 'datadog' },
  { displayName: 'X', logo: 'twitter' },
  { displayName: 'Facebook Pages', logo: 'facebook' },
  { displayName: 'YouTube', logo: 'youtube' },
  { displayName: 'Reddit', logo: 'reddit' },
  { displayName: 'Figma', logo: 'figma' },
  { displayName: 'Confluence', logo: 'confluence' },
  { displayName: 'Xero', logo: 'xero' },
  { displayName: 'Square', logo: 'square' },
  { displayName: 'WooCommerce', logo: 'woocommerce' },
  { displayName: 'BigCommerce', logo: 'bigcommerce' },
];

type PieceTile = {
  displayName: string;
  logo: string;
};
