import { BonjoroAuthType } from "./auth";
import { getCampaigns, getTemplates, getUsers } from "./api";

export async function buildCampaignDropdown(auth: BonjoroAuthType) {
	if (!auth) {
		return {
			options     : [],
			disabled    : true,
			placeholder : 'Please authenticate first',
		};
	}
	const response = await getCampaigns(auth as BonjoroAuthType);
	const options  = response.data.map(campaign => {
		return { label: campaign.name, value: campaign.id }
	});
	return {
		options : options,
	};
}

export async function buildTemplateDropdown(auth: BonjoroAuthType) {
	if (!auth) {
		return {
			options     : [],
			disabled    : true,
			placeholder : 'Please authenticate first',
		};
	}
	const response = await getTemplates(auth as BonjoroAuthType);
	const options  = response.data.map(template => {
		return { label: template.name, value: template.id }
	});
	return {
		options : options,
	};
}


export async function buildUserDropdown(auth: BonjoroAuthType) {
	if (!auth) {
		return {
			options     : [],
			disabled    : true,
			placeholder : 'Please authenticate first',
		};
	}
	const response = await getUsers(auth as BonjoroAuthType);
	const options  = response.data.map(user => {
		return { label: user.name, value: user.id }
	});
	return {
		options : options,
	};
}

