import { getCampaigns, getLists } from './client';

export async function buildListsDropdown(auth: string) {
  if (!auth) {
    return {
      options: [],
      disabled: true,
      placeholder: 'Please authenticate first',
    };
  }

  try {
    const response = await getLists(auth);

    if (response.status === 'success' && response.data.records && Array.isArray(response.data.records)) {
      const options = response.data.records.map((list) => {
        return {
          label: list.general.name || list.general.display_name,
          value: list.general.list_uid
        };
      });

      return {
        options: options,
      };
    } else {
      return {
        options: [],
        disabled: true,
        placeholder: 'No lists found',
      };
    }
  } catch (error) {
    console.error('Error fetching lists:', error);
    return {
      options: [],
      disabled: true,
      placeholder: 'Error fetching lists',
    };
  }
}

export async function buildCampaignsDropdown(auth: string) {
  if (!auth) {
    return {
      options: [],
      disabled: true,
      placeholder: 'Please authenticate first',
    };
  }

  try {
    const response = await getCampaigns(auth);

    if (response.status === 'success' && response.data.records && Array.isArray(response.data.records)) {
      const options = response.data.records.map((campaign) => {
        return {
          label: campaign.name,
          value: campaign.campaign_uid
        };
      });

      return {
        options: options,
      };
    } else {
      return {
        options: [],
        disabled: true,
        placeholder: 'No campaigns found',
      };
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return {
      options: [],
      disabled: true,
      placeholder: 'Error fetching campaigns',
    };
  }
}
