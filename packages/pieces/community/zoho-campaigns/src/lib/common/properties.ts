import { Property } from '@activepieces/pieces-framework';
import { zohoCampaignsCommon } from '.';

// Custom Properties
const campaignDropdown = () =>
  Property.Dropdown({
    displayName: 'Campaign',
    description: 'Select the campaign',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      const { access_token: accessToken } = auth as { access_token: string };
      if (!accessToken) {
        return {
          disabled: true,
          placeholder: 'Connect your Zoho Campaigns account first',
          options: [],
        };
      }
      const campaigns = await zohoCampaignsCommon.listCampaigns({
        accessToken,
      });
      if (campaigns.length === 0) {
        return {
          disabled: true,
          placeholder: 'No campaigns found',
          options: [],
        };
      }

      return {
        options: campaigns.map((campaign) => ({
          label: campaign.campaign_name,
          value: campaign.campaign_key,
        })),
      };
    },
  });

const mailingListDropdown = ({ required = true }) =>
  Property.Dropdown({
    displayName: 'Mailing List',
    description: 'Select the mailing list',
    required: required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      const { access_token: accessToken } = auth as { access_token: string };
      if (!accessToken) {
        return {
          disabled: true,
          placeholder: 'Connect your Zoho Campaigns account first',
          options: [],
        };
      }
      const mailingLists = await zohoCampaignsCommon.listMailingLists({
        accessToken,
      });
      if (mailingLists.length === 0) {
        return {
          disabled: true,
          placeholder: 'No mailing lists found',
          options: [],
        };
      }
      return {
        options: mailingLists.map((list) => ({
          label: list.listname,
          value: list.listkey,
        })),
      };
    },
  });

const mailingListMultiSelectDropdown = ({ required = true }) =>
  Property.MultiSelectDropdown({
    displayName: 'Mailing Lists',
    description: 'Select the mailing lists',
    required: required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      const { access_token: accessToken } = auth as { access_token: string };
      if (!accessToken) {
        return {
          disabled: true,
          placeholder: 'Connect your Zoho Campaigns account first',
          options: [],
        };
      }
      const mailingLists = await zohoCampaignsCommon.listMailingLists({
        accessToken,
      });
      if (mailingLists.length === 0) {
        return {
          disabled: true,
          placeholder: 'No mailing lists found',
          options: [],
        };
      }
      return {
        options: mailingLists.map((list) => ({
          label: list.listname,
          value: list.listkey,
        })),
      };
    },
  });

const topicDropdown = ({ required = true }) =>
  Property.Dropdown({
    displayName: 'Topic',
    description: 'Select the topic',
    required: required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      const { access_token: accessToken } = auth as { access_token: string };
      if (!accessToken) {
        return {
          disabled: true,
          placeholder: 'Connect your Zoho Campaigns account first',
          options: [],
        };
      }
      const topics = await zohoCampaignsCommon.listTopics({ accessToken });
      if (topics.length === 0) {
        return {
          disabled: true,
          placeholder: 'No topics found',
          options: [],
        };
      }
      return {
        options: topics.map((topic) => ({
          label: topic.topicName,
          value: topic.topicId,
        })),
      };
    },
  });

const contactInformation = Property.DynamicProperties({
  displayName: 'Contact Information',
  description: 'Information about the contact',
  required: true,
  refreshers: ['auth'],
  props: async () => ({
    'Contact Email': Property.ShortText({
      displayName: 'Contact Email',
      description: 'Email of the contact',
      required: true,
    }),
    'First Name': Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: false,
    }),
    'Last Name': Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: false,
    }),
    Phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the contact',
      required: false,
    }),
    'Company Name': Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name of the contact',
      required: false,
    }),
    additionalFields: Property.Object({
      displayName: 'Additional Fields',
      description:
        'Additional fields for the contact in key-value pairs. For example, {"City": "New York", "State": "NY"}',
      required: false,
    }),
  }),
});

// Action Properties
export const createCampaign = () => ({
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
  list_details: mailingListMultiSelectDropdown({ required: true }),
  content_url: Property.ShortText({
    displayName: 'Content URL',
    description:
      'A valid HTML URL for your campaign content. In the Sample JSON Request, replace <public_content_url> with the actual public URL in which your campaign content is present.',
    required: false,
  }),
  topicId: topicDropdown({ required: false }),
});

export const cloneCampaign = () => ({
  campaignkey: campaignDropdown(),
  campaignname: Property.ShortText({
    displayName: 'Campaign Name',
    description: 'A name to your campaign',
    required: true,
  }),
  subject: Property.ShortText({
    displayName: 'Subject',
    description: 'The subject line of the campaign',
    required: false,
  }),
});

export const sendCampaign = () => ({
  campaignkey: campaignDropdown(),
});

export const addUpdateContact = () => ({
  listkey: mailingListDropdown({ required: true }),
  contactinfo: contactInformation,
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
  listkey: mailingListDropdown({ required: true }),
  contactEmail: Property.ShortText({
    displayName: 'Contact Email',
    description: 'Email of the contact to be unsubscribed',
    required: true,
  }),
  topic_id: topicDropdown({ required: false }),
});

export const addContactToMailingList = () => ({
  listkey: mailingListDropdown({ required: true }),
  emails: Property.Array({
    displayName: 'Emails',
    description: 'Contacts email addresses to be added to the mailing list',
    required: true,
  }),
});

export const findContact = () => ({
  listkey: mailingListDropdown({ required: true }),
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

export const newContact = () => ({
  listkey: mailingListDropdown({ required: true }),
});

export const unsubscribe = () => ({
  listkey: mailingListDropdown({ required: true }),
})
