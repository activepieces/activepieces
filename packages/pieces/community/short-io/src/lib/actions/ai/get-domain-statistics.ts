import { createAction } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../../common/ai-props';
import { shortIoAuth } from '../../common/auth';
import { shortIoLinks } from '../../common/links';
import { shortIoSchemas } from '../../common/output-schemas';
import { shortIoStats } from '../../common/stats';

export const getDomainStatisticsAiAction = createAction({
  auth: shortIoAuth,
  name: 'get_domain_statistics',
  displayName: 'Get Domain Statistics (AI)',
  description: 'Get click and link totals for a whole domain over a period.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns total and human clicks, links created, and top countries, referrers and browsers for a whole Short.io domain over a period. Custom period needs start and end dates (YYYY-MM-DD). Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.domainStats,
  props: {
    domain: shortIoAiProps.domain(),
    period: shortIoAiProps.period('Time period for the statistics. Default: last 30 days.'),
    startDate: shortIoAiProps.startDate(),
    endDate: shortIoAiProps.endDate(),
    tz: shortIoAiProps.timezone(),
  },
  async run({ auth, propsValue }) {
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    return shortIoStats.domainStatistics({
      auth,
      domainId: domain.id,
      period: propsValue.period,
      startDate: propsValue.startDate,
      endDate: propsValue.endDate,
      tz: propsValue.tz,
    });
  },
});
