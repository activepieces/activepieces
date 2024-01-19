import { BonjoroAuthType } from './auth';
import { getCampaigns, getTemplates, getUsers } from './api';

type BonjoroData = { id: string; name: string; uuid: string };

export async function buildCampaignDropdown(auth: BonjoroAuthType) {
  if (!auth) {
    return {
      options: [],
      disabled: true,
      placeholder: 'Please authenticate first',
    };
  }
  const response = await getCampaigns(auth as BonjoroAuthType);
  const options = (response.data as BonjoroData[]).map((campaign) => {
    return { label: campaign.name, value: campaign.uuid };
  });
  return {
    options: options,
  };
}

export async function buildTemplateDropdown(auth: BonjoroAuthType) {
  if (!auth) {
    return {
      options: [],
      disabled: true,
      placeholder: 'Please authenticate first',
    };
  }
  const response = await getTemplates(auth as BonjoroAuthType);
  const options = (response.data as BonjoroData[]).map((template) => {
    return { label: template.name, value: template.id };
  });
  return {
    options: options,
  };
}

export async function buildUserDropdown(auth: BonjoroAuthType) {
  if (!auth) {
    return {
      options: [],
      disabled: true,
      placeholder: 'Please authenticate first',
    };
  }
  const response = await getUsers(auth as BonjoroAuthType);
  const options = (response.data as BonjoroData[]).map((user) => {
    return { label: user.name, value: user.id };
  });
  return {
    options: options,
  };
}
