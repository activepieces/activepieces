import { BonjoroAuthType } from "./auth";
import { getCampaigns, getTemplates, getUsers, KeyValuePair } from "./api";

export async function buildCampaignDropdown(auth: BonjoroAuthType) {
	if (!auth) {
		return {
			options     : [],
			disabled    : true,
			placeholder : 'Please authenticate first',
		};
	}
	const response = await getCampaigns(auth as BonjoroAuthType);
	const options = response.data.map(campaign => {
		return { label: campaign.name, value: campaign.id }
	});
	return {
		options: options,
	};
}

export async function buildListDropdown(auth: BonjoroAuthType) {
	if (!auth) {
		return {
			options     : [],
			disabled    : true,
			placeholder : 'Please authenticate first',
		};
	}
	const response = await getLists(auth as BonjoroAuthType);
	const options = response.data.map(list => {
		return { label: list.name, value: list.id }
	});
	return {
		options: options,
	};
}
