import type { FacebookLeadsLead } from './types';

function transformLeadData({ lead }: { lead: FacebookLeadsLead }) {
	return {
		lead_id: lead.id,
		form_id: lead.form_id,
		platform: lead.platform ?? null,
		ad_id: lead.ad_id ?? null,
		ad_name: lead.ad_name ?? null,
		adset_id: lead.adset_id ?? null,
		adset_name: lead.adset_name ?? null,
		campaign_id: lead.campaign_id ?? null,
		campaign_name: lead.campaign_name ?? null,
		created_time: lead.created_time,
		data: lead.field_data.reduce(
			(acc, field) => ({
				...acc,
				[field.name]: field.values && field.values.length > 0 ? field.values[0] : null,
			}),
			{},
		),
	};
}

export const facebookLeadsUtils = { transformLeadData };
