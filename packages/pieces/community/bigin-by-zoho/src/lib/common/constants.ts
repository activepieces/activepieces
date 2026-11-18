export const DATA_CENTER_REGIONS = [
    {
    REGION: "US",
    ACCOUNTS_DOMAIN: "https://accounts.zoho.com",
    API_DOMAIN: "https://www.zohoapis.com",
    LABEL: "United States (.com)"
  },
  {
    REGION: "AU",
    ACCOUNTS_DOMAIN: "https://accounts.zoho.com.au",
    API_DOMAIN: "https://www.zohoapis.com.au",
    LABEL: "Australia (.com.au)"
  },
  {
    REGION: "EU",
    ACCOUNTS_DOMAIN: "https://accounts.zoho.eu",
    API_DOMAIN: "https://www.zohoapis.eu",
    LABEL: "Europe (.eu)"
  },
  {
    REGION: "IN",
    ACCOUNTS_DOMAIN: "https://accounts.zoho.in",
    API_DOMAIN: "https://www.zohoapis.in",
    LABEL: "India (.in)"
  },
  {
    REGION: "CN",
    ACCOUNTS_DOMAIN: "https://accounts.zoho.com.cn",
    API_DOMAIN: "https://www.zohoapis.com.cn",
    LABEL: "China (.com.cn)"
  },
  {
    REGION: "JP",
    ACCOUNTS_DOMAIN: "https://accounts.zoho.jp",
    API_DOMAIN: "https://www.zohoapis.jp",
    LABEL: "Japan (.jp)"
  },
  {
    REGION: "SA",
    ACCOUNTS_DOMAIN: "https://accounts.zoho.sa",
    API_DOMAIN: "https://www.zohoapis.sa",
    LABEL: "Saudi Arabia (.sa)"
  },
  {
    REGION: "CA",
    ACCOUNTS_DOMAIN: "https://accounts.zohocloud.ca",
    API_DOMAIN: "https://www.zohoapis.ca",
    LABEL: "Canada (.ca)"
  }
];

export const ZOHO_WEBHOOK_TOKEN = 'bigin_webhook_token';

export const API_ENDPOINTS = {
  WEBHOOKS: `/actions/watch`,
  USERS: `/users`,
  COMPANIES: `/Accounts`,
  PIPELINES: `/Pipelines`,
  CONTACTS: `/Contacts`,
  TASKS: `/Tasks`,
  CALLS: `/Calls`,
  EVENTS: `/Events`,
  MODULES: `/settings/modules`,
  LAYOUTS: `/settings/layouts`,
  TAGS: `/settings/tags`,
  PRODUCTS: `/Products`,
  FIELDS: `/settings/fields`,
};

export const BIGIN_RECORD_MODULES = [
  { label: 'Contacts', value: 'Contacts' },
  { label: 'Companies (Accounts)', value: 'Accounts' },
  { label: 'Pipelines (Deals)', value: 'Pipelines' },
  { label: 'Products', value: 'Products' },
  { label: 'Tasks', value: 'Tasks' },
  { label: 'Events', value: 'Events' },
  { label: 'Calls', value: 'Calls' },
];

export const BIGIN_DEFAULT_LIST_FIELDS: Record<string, string> = {
  Contacts: 'First_Name,Last_Name,Email,Mobile,Phone,Title,Account_Name,Owner,Created_Time,Modified_Time',
  Accounts: 'Account_Name,Phone,Website,Billing_City,Billing_Country,Owner,Created_Time,Modified_Time',
  Pipelines: 'Deal_Name,Stage,Sub_Pipeline,Pipeline,Amount,Closing_Date,Account_Name,Contact_Name,Owner,Created_Time,Modified_Time',
  Products: 'Product_Name,Product_Code,Unit_Price,Product_Active,Owner,Created_Time,Modified_Time',
  Tasks: 'Subject,Status,Priority,Due_Date,Related_To,Owner,Created_Time,Modified_Time',
  Events: 'Event_Title,Start_DateTime,End_DateTime,All_day,Venue,Related_To,Owner,Created_Time,Modified_Time',
  Calls: 'Subject,Call_Type,Call_Start_Time,Call_Duration,Related_To,Owner,Created_Time,Modified_Time',
};
