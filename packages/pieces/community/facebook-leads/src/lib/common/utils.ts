import type { FacebookLeadsLead } from './types';

function transformLeadData({ lead }: { lead: FacebookLeadsLead }) {
	return {
		lead_id: lead.id,
		form_id: lead.form_id,
		platform: lead.platform,
		ad_id: lead.ad_id,
		ad_name: lead.ad_name,
		adset_id: lead.adset_id,
		adset_name: lead.adset_name,
		campaign_id: lead.campaign_id,
		campaign_name: lead.campaign_name,
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
