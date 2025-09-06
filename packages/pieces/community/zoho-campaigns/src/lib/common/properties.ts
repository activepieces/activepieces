import { Property } from '@activepieces/pieces-framework';
import { zohoCampaignsCommon } from '.';

// Custom Properties
const campaignDropdown = () =>
  Property.Dropdown({
    displayName: 'Campaign',
    description: 'Select the campaign to clone',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      const accessToken = auth as string;
      if (!accessToken) {
        return {
          disabled: true,
          options: [],
        };
      }
      const campaigns = await zohoCampaignsCommon.listCampaigns({ accessToken });
      return {
        options: campaigns.map(
          (campaign: { campaignname: string; campaignkey: string }) => ({
            label: campaign.campaignname,
            value: campaign.campaignkey,
          })
        ),
      };
    },
  });

const topicDropdown = ({ required = true }) =>
  Property.Dropdown({
    displayName: 'Topic',
    description: 'Select the topic',
    required: required,
    refreshers: ['auth'],
    options: async ({ auth }): Promise<{ options: { label: string; value: string }[]; disabled?: boolean }> => {
      const accessToken = auth as string;
      if (!accessToken) {
        return {
          disabled: true,
          options: [],
        };
      }
      const topics = await zohoCampaignsCommon.listTopics({ accessToken });
      return {
        options: topics.map(
          (topic: { topicname: string; topicid: string }) => ({
            label: topic.topicname,
            value: topic.topicid,
          })
        ),
      };
    },
  });

// Action Properties
export const createCampaign = {
  campaignname: Property.ShortText({
    displayName: 'Campaign Name',
    description: 'A name to your campaign',
    required: true,
  }),
  from_email: Property.ShortText({
    displayName: 'From Email',
    description: 'The email address from which the campaign will be sent',
    required: true,
  }),
  subject: Property.ShortText({
    displayName: 'Subject',
    description: 'The subject line of the campaign',
    required: true,
  }),
  content_url: Property.ShortText({
    displayName: 'Content URL',
    description:
      'A valid HTML URL for your campaign content. In the Sample JSON Request, replace <public_content_url> with the actual public URL in which your campaign content is present.',
    required: false,
  }),
  list_details: Property.Object({
    displayName: 'List Details',
    description: 'Details about the mailing list',
    required: true,
  }),
  topicId: topicDropdown({ required: true }),
};

export const cloneCampaign = () => ({
  campaignkey: campaignDropdown(),
});

export const sendCampaign = () => ({
  campaignkey: campaignDropdown(),
});

export const addUpdateContact = () => ({
  listkey: campaignDropdown(),
  contactinfo: Property.Object({
    displayName: 'Contact Information',
    description: 'Information about the contact to be added or updated',
    required: true,
  }),
  source: Property.ShortText({
    displayName: 'Source',
    description: 'Contact source can be added.',
    required: false,
  }),
  topic_id: topicDropdown({ required: false }),
});

export const addTagToContact = {
  tagName: Property.ShortText({
    displayName: 'Tag Name',
    description: 'Name of the tag to be added to the contact',
    required: true,
  }),
  lead_email: Property.ShortText({
    displayName: 'Contact Email',
    description: 'Email of the contact to which the tag will be added',
    required: true,
  }),
};

export const removeTag = {
  tagName: Property.ShortText({
    displayName: 'Tag Name',
    description: 'Name of the tag to be added to the contact',
    required: true,
  }),
  lead_email: Property.ShortText({
    displayName: 'Contact Email',
    description: 'Email of the contact to which the tag will be added',
    required: true,
  }),
};

export const unsubscribeContact = () => ({
  listkey: campaignDropdown(),
  contactinfo: Property.Object({
    displayName: 'Contact Information',
    description: 'Information about the contact to be added or updated',
    required: true,
  }),
  topic_id: topicDropdown({ required: false }),
});

export const addContactToMailingList = () => ({
  listkey: campaignDropdown(),
  emails: Property.Array({
    displayName: 'Emails',
    description: 'Contacts email addresses to be added to the mailing list',
    required: true,
  }),
});

export const findContact = () => ({
  listkey: campaignDropdown(),
  contactEmail: Property.ShortText({
    displayName: 'Contact Email',
    description: 'Email of the contact to be found',
    required: true,
  }),
});

export const findCampaign = {
  campaignName: Property.ShortText({
    displayName: 'Campaign Name',
    description: 'Name of the campaign to be found',
    required: true,
  }),
};
