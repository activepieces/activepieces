import { Property } from '@activepieces/pieces-framework';
import { zohoCampaignsCommon } from '.';
import { Tag } from './types';

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

const tagDropdown = ({ required = true }: { required?: boolean }) =>
  Property.Dropdown({
    displayName: 'Tag',
    description: 'Select the tag to associate with the contact',
    required: required,
    refreshers: ['auth'],
    options: async ({ auth }): Promise<{ disabled?: boolean; placeholder?: string; options: Array<{ label: string; value: string }> }> => {
      const { access_token: accessToken } = auth as { access_token: string };
      if (!accessToken) {
        return {
          disabled: true,
          placeholder: 'Connect your Zoho Campaigns account first',
          options: [],
        };
      }
      const tags = await zohoCampaignsCommon.listTags({
        accessToken,
      });
      if (!tags || tags.length === 0) {
        return {
          disabled: true,
          placeholder: 'No tags found',
          options: [],
        };
      }

      const tagOptions = tags.flatMap((tagMap: Tag) =>
        Object.values(tagMap).map((tag: any) => ({
          label: tag.tag_name,
          value: tag.tag_name,
        }))
      );

      return {
        options: tagOptions,
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
      description: 'Email address of the contact',
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
    description: 'Sender email address for the campaign',
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
    description: 'Public URL containing the HTML content for your campaign',
    required: false,
  }),
  topicId: topicDropdown({ required: false }),
});

export const cloneCampaign = () => ({
  campaignkey: campaignDropdown(),
  campaignname: Property.ShortText({
    displayName: 'Campaign Name',
    description: 'New name for the cloned campaign',
    required: false,
  }),
  subject: Property.ShortText({
    displayName: 'Subject',
    description: 'New subject line for the cloned campaign',
    required: false,
  }),
  from_name: Property.ShortText({
    displayName: 'From Name',
    description: 'Sender name for the cloned campaign',
    required: false,
  }),
  from_add: Property.ShortText({
    displayName: 'From Email',
    description: 'Sender email address for the cloned campaign',
    required: false,
  }),
  reply_to: Property.ShortText({
    displayName: 'Reply-To Email',
    description: 'Reply-to email address for the cloned campaign',
    required: false,
  }),
  encode_type: Property.ShortText({
    displayName: 'Encoding Type',
    description: 'Email encoding type (e.g., UTF-8)',
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

export const addTagToContact: {
  tagName: any;
  lead_email: any;
} = {
  tagName: tagDropdown({ required: true }),
  lead_email: Property.ShortText({
    displayName: 'Contact Email',
    description: 'Email address of the contact to tag',
    required: true,
  }),
};

export const removeTag: {
  tagName: any;
  lead_email: any;
} = {
  tagName: tagDropdown({ required: true }),
  lead_email: Property.ShortText({
    displayName: 'Contact Email',
    description: 'Email address of the contact to remove the tag from',
    required: true,
  }),
};

export const unsubscribeContact = () => ({
  listkey: mailingListDropdown({ required: true }),
  contactinfo: contactInformation,
  topic_id: topicDropdown({ required: false }),
});

export const addContactToMailingList = () => ({
  listkey: mailingListDropdown({ required: true }),
  emails: Property.Array({
    displayName: 'Emails',
    description: 'Contacts email addresses to be added to the mailing list (maximum 10 emails)',
    required: true,
  }),
});

export const findContact = () => ({
  listkey: mailingListDropdown({ required: true }),
  contactEmail: Property.ShortText({
    displayName: 'Contact Email',
    description: 'Email of the contact to be found (partial matches supported)',
    required: true,
  }),
  status: Property.StaticDropdown({
    displayName: 'Contact Status',
    description: 'Filter contacts by status (optional)',
    required: false,
    options: {
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Recent', value: 'recent' },
        { label: 'Most Recent', value: 'most recent' },
        { label: 'Unsubscribed', value: 'unsub' },
        { label: 'Bounced', value: 'bounce' },
      ],
    },
  }),
  sort: Property.StaticDropdown({
    displayName: 'Sort Order',
    description: 'Sort order for results (optional)',
    required: false,
    options: {
      options: [
        { label: 'Ascending', value: 'asc' },
        { label: 'Descending', value: 'desc' },
      ],
    },
  }),
  fromindex: Property.Number({
    displayName: 'From Index',
    description: 'Starting index for pagination (optional, default: 1)',
    required: false,
  }),
  range: Property.Number({
    displayName: 'Range',
    description: 'Number of contacts to retrieve (optional, default: all)',
    required: false,
  }),
});

export const findCampaign = () => ({
  campaignName: Property.ShortText({
    displayName: 'Campaign Name',
    description: 'Name of the campaign to be found (partial matches supported)',
    required: true,
  }),
  status: Property.StaticDropdown({
    displayName: 'Campaign Status',
    description: 'Filter campaigns by status (optional)',
    required: false,
    options: {
      options: [
        { label: 'All', value: 'all' },
        { label: 'All Campaigns', value: 'all campaigns' },
        { label: 'Drafts', value: 'drafts' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'In Progress', value: 'inprogress' },
        { label: 'Sent', value: 'sent' },
        { label: 'Stopped', value: 'stopped' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'To Be Reviewed', value: 'tobereviewed' },
        { label: 'Reviewed', value: 'reviewed' },
        { label: 'Paused', value: 'paused' },
        { label: 'In Testing', value: 'intesting' },
      ],
    },
  }),
  sort: Property.StaticDropdown({
    displayName: 'Sort Order',
    description: 'Sort order for results (optional)',
    required: false,
    options: {
      options: [
        { label: 'Ascending', value: 'asc' },
        { label: 'Descending', value: 'desc' },
      ],
    },
  }),
  fromindex: Property.Number({
    displayName: 'From Index',
    description: 'Starting index for pagination (optional, default: 1)',
    required: false,
  }),
  range: Property.Number({
    displayName: 'Range',
    description: 'Number of campaigns to retrieve (optional, default: 5)',
    required: false,
  }),
});

export const newContact = () => ({
  listkey: mailingListDropdown({ required: true }),
  status: Property.StaticDropdown({
    displayName: 'Contact Status',
    description: 'Filter contacts by status (default: active)',
    required: false,
    options: {
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Recent', value: 'recent' },
        { label: 'Most Recent', value: 'most recent' },
        { label: 'Unsubscribed', value: 'unsub' },
        { label: 'Bounced', value: 'bounce' },
      ],
    },
  }),
  sort: Property.StaticDropdown({
    displayName: 'Sort Order',
    description: 'Sort order for contacts (default: descending)',
    required: false,
    options: {
      options: [
        { label: 'Ascending', value: 'asc' },
        { label: 'Descending', value: 'desc' },
      ],
    },
  }),
});

export const unsubscribe = () => ({
  listkey: mailingListDropdown({ required: true }),
  status: Property.StaticDropdown({
    displayName: 'Unsubscribe Type',
    description: 'Type of contact removal to monitor (default: unsubscribed)',
    required: false,
    options: {
      options: [
        { label: 'Unsubscribed', value: 'unsub' },
        { label: 'Bounced', value: 'bounce' },
      ],
    },
  }),
})
