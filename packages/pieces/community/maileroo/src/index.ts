import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { sendEmail } from './lib/actions/send-email';
import { sendFromTemplate } from './lib/actions/send-from-template';
import { verifyEmail } from './lib/actions/verify-email';
import { mailerooAuth } from './lib/auth';
import { mailerooCreateDomain } from './lib/actions/ai/create-domain';
import { mailerooCreateInboundRoute } from './lib/actions/ai/create-inbound-route';
import { mailerooCreateSuppression } from './lib/actions/ai/create-suppression';
import { mailerooCreateTemplate } from './lib/actions/ai/create-template';
import { mailerooDeleteDomain } from './lib/actions/ai/delete-domain';
import { mailerooDeleteInboundRoute } from './lib/actions/ai/delete-inbound-route';
import { mailerooDeleteScheduledEmail } from './lib/actions/ai/delete-scheduled-email';
import { mailerooDeleteSuppression } from './lib/actions/ai/delete-suppression';
import { mailerooDeleteTemplate } from './lib/actions/ai/delete-template';
import { mailerooGetDomainAnalytics } from './lib/actions/ai/get-domain-analytics';
import { mailerooGetDomain } from './lib/actions/ai/get-domain';
import { mailerooGetEmailLog } from './lib/actions/ai/get-email-log';
import { mailerooGetInboundRoute } from './lib/actions/ai/get-inbound-route';
import { mailerooGetStatisticsSummary } from './lib/actions/ai/get-statistics-summary';
import { mailerooGetStatisticsTimeline } from './lib/actions/ai/get-statistics-timeline';
import { mailerooGetTemplate } from './lib/actions/ai/get-template';
import { mailerooListDomains } from './lib/actions/ai/list-domains';
import { mailerooListInboundRoutes } from './lib/actions/ai/list-inbound-routes';
import { mailerooListScheduledEmails } from './lib/actions/ai/list-scheduled-emails';
import { mailerooListSuppressions } from './lib/actions/ai/list-suppressions';
import { mailerooListTemplates } from './lib/actions/ai/list-templates';
import { mailerooRenameTemplate } from './lib/actions/ai/rename-template';
import { mailerooRenderEmailLog } from './lib/actions/ai/render-email-log';
import { mailerooResendEmail } from './lib/actions/ai/resend-email';
import { mailerooSearchDomainEmailLogs } from './lib/actions/ai/search-domain-email-logs';
import { mailerooSearchEmailLogs } from './lib/actions/ai/search-email-logs';
import { mailerooSendBulkEmails } from './lib/actions/ai/send-bulk-emails';
import { mailerooSendEmail } from './lib/actions/ai/send-email';
import { mailerooUpdateDomainSettings } from './lib/actions/ai/update-domain-settings';
import { mailerooUpdateInboundRoute } from './lib/actions/ai/update-inbound-route';

function baseUrlFor(keyType: string | undefined): string {
  if (keyType === 'account') return 'https://api.maileroo.com/v1';
  if (keyType === 'verification') return 'https://verify.maileroo.net';
  return 'https://smtp.maileroo.com/api/v2';
}

export const maileroo = createPiece({
  displayName: 'Maileroo',
  auth: mailerooAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/maileroo.png',
  categories: [
    PieceCategory.MARKETING,
    PieceCategory.BUSINESS_INTELLIGENCE,
    PieceCategory.COMMUNICATION,
  ],
  description: 'Email Delivery Service with Real-Time Analytics and Reporting',
  authors: ['codegino'],
  actions: [
    sendEmail,
    sendFromTemplate,
    verifyEmail,
    mailerooCreateDomain,
    mailerooCreateInboundRoute,
    mailerooCreateSuppression,
    mailerooCreateTemplate,
    mailerooDeleteDomain,
    mailerooDeleteInboundRoute,
    mailerooDeleteScheduledEmail,
    mailerooDeleteSuppression,
    mailerooDeleteTemplate,
    mailerooGetDomainAnalytics,
    mailerooGetDomain,
    mailerooGetEmailLog,
    mailerooGetInboundRoute,
    mailerooGetStatisticsSummary,
    mailerooGetStatisticsTimeline,
    mailerooGetTemplate,
    mailerooListDomains,
    mailerooListInboundRoutes,
    mailerooListScheduledEmails,
    mailerooListSuppressions,
    mailerooListTemplates,
    mailerooRenameTemplate,
    mailerooRenderEmailLog,
    mailerooResendEmail,
    mailerooSearchDomainEmailLogs,
    mailerooSearchEmailLogs,
    mailerooSendBulkEmails,
    mailerooSendEmail,
    mailerooUpdateDomainSettings,
    mailerooUpdateInboundRoute,
    createCustomApiCallAction({
      baseUrl: (auth) => baseUrlFor(auth?.props.keyType),
      auth: mailerooAuth,
      authMapping: async (auth) =>
        auth.props.keyType === 'account'
          ? { Authorization: `Bearer ${auth.props.apiKey}` }
          : { 'X-API-Key': auth.props.apiKey },
    }),
  ],
  triggers: [],
});
