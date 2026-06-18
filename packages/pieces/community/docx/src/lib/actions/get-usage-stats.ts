import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { docxAuth } from '../common/auth';
import { docxRequest } from '../common/client';

interface DocxUsageStats {
  plan?: string;
  quota?: { limit?: number; used?: number; remaining?: number };
  rate_limit?: number;
  current_concurrent?: number;
}

export const getUsageStats = createAction({
  auth: docxAuth,
  name: 'get_usage_stats',
  displayName: "Consulter le quota et l'usage",
  description:
    "Retourne le plan, le quota (limite / utilisé / restant) et les statistiques d'usage de la clé API.",
  props: {},
  async run(context) {
    const data = await docxRequest<{ stats?: DocxUsageStats }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/usage-stats',
    });
    const stats = data.stats || {};
    return {
      plan: stats.plan,
      quota_limit: stats.quota?.limit,
      quota_used: stats.quota?.used,
      quota_remaining: stats.quota?.remaining,
      rate_limit: stats.rate_limit,
      current_concurrent: stats.current_concurrent,
    };
  },
});
