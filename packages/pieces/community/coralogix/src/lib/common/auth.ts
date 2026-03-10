import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const coralogixAuth = PieceAuth.CustomAuth({
  displayName: 'Coralogix Credentials',
  description:
    'Management API uses api.coralogix.com. Select ingestion region domain and provide both API keys.',
  required: true,
  props: {
    personalOrTeamApiKey: PieceAuth.SecretText({
      displayName: 'Personal/Team API Key',
      description:
        'Used for Coralogix management APIs (for example alert definitions, incidents, dashboards).',
      required: true,
    }),
    sendYourDataApiKey: PieceAuth.SecretText({
      displayName: 'Send-Your-Data API Key',
      description:
        'Used for Coralogix ingestion APIs (for example /logs/v1/singles). Find it in Settings → API Keys → Send Your Data.',
      required: false,
    }),
    coralogixDomain: Property.StaticDropdown({
      displayName: 'Ingestion Region Domain',
      description:
        'Select your Coralogix regional domain for ingestion endpoints.',
      required: true,
      defaultValue: 'eu1.coralogix.com',
      options: {
        options: [
          { label: 'EU1 (<team>.coralogix.com)', value: 'eu1.coralogix.com' },
          { label: 'EU2 (<team>.app.eu2.coralogix.com)', value: 'eu2.coralogix.com' },
          { label: 'US1 (<team>.app.coralogix.us)', value: 'us1.coralogix.com' },
          { label: 'US2 (<team>.app.cx498.coralogix.com)', value: 'us2.coralogix.com' },
          { label: 'AP1 (<team>.app.coralogix.in)', value: 'ap1.coralogix.com' },
          { label: 'AP2 (<team>.app.coralogixsg.com)', value: 'ap2.coralogix.com' },
          { label: 'AP3 (<team>.app.ap3.coralogix.com)', value: 'ap3.coralogix.com' },
        ],
      },
    }),
  },
});
