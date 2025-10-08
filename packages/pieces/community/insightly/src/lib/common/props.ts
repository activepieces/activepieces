import { Property } from '@activepieces/pieces-framework';

// Helper function to create a common set of fields
const NameFields = {
  SALUTATION: Property.ShortText({
    displayName: 'Salutation',
    required: false,
  }),
  FIRST_NAME: Property.ShortText({
    displayName: 'First Name',
    required: false,
  }),
  LAST_NAME: Property.ShortText({
    displayName: 'Last Name',
    required: false,
  }),
  TITLE: Property.ShortText({
    displayName: 'Title',
    required: false,
  }),
};

const ContactInfoFields = {
  PHONE: Property.ShortText({
    displayName: 'Phone',
    required: false,
  }),
  PHONE_HOME: Property.ShortText({
    displayName: 'Home Phone',
    required: false,
  }),
  PHONE_MOBILE: Property.ShortText({
    displayName: 'Mobile Phone',
    required: false,
  }),
  PHONE_OTHER: Property.ShortText({
    displayName: 'Other Phone',
    required: false,
  }),
  PHONE_ASSISTANT: Property.ShortText({
    displayName: 'Assistant Phone',
    required: false,
  }),
  PHONE_FAX: Property.ShortText({
    displayName: 'Fax',
    required: false,
  }),
  EMAIL_ADDRESS: Property.ShortText({
    displayName: 'Email Address',
    required: false,
  }),
};

const AddressFields = (type: 'Mail' | 'Other') => ({
  [`ADDRESS_${type.toUpperCase()}_STREET`]: Property.ShortText({
    displayName: `${type} Street`,
    required: false,
  }),
  [`ADDRESS_${type.toUpperCase()}_CITY`]: Property.ShortText({
    displayName: `${type} City`,
    required: false,
  }),
  [`ADDRESS_${type.toUpperCase()}_STATE`]: Property.ShortText({
    displayName: `${type} State`,
    required: false,
  }),
  [`ADDRESS_${type.toUpperCase()}_POSTCODE`]: Property.ShortText({
    displayName: `${type} Postcode`,
    required: false,
  }),
  [`ADDRESS_${type.toUpperCase()}_COUNTRY`]: Property.ShortText({
    displayName: `${type} Country`,
    required: false,
  }),
});


export const contactFields = {
  ...NameFields,
  ...ContactInfoFields,
  ...AddressFields('Mail'),
  ...AddressFields('Other'),
  BACKGROUND: Property.LongText({
    displayName: 'Background',
    required: false,
  }),
  OWNER_USER_ID: Property.Number({
    displayName: 'Owner User ID',
    required: false,
  }),
  SOCIAL_LINKEDIN: Property.ShortText({
    displayName: 'LinkedIn',
    required: false,
  }),
  SOCIAL_FACEBOOK: Property.ShortText({
    displayName: 'Facebook',
    required: false,
  }),
  SOCIAL_TWITTER: Property.ShortText({
    displayName: 'Twitter',
    required: false,
  }),
  DATE_OF_BIRTH: Property.ShortText({
    displayName: 'Date of Birth',
    description: 'Format: YYYY-MM-DD',
    required: false,
  }),
  ASSISTANT_NAME: Property.ShortText({
    displayName: 'Assistant Name',
    required: false,
  }),
  ORGANISATION_ID: Property.Number({
    displayName: 'Organization ID',
    required: false,
  }),
  EMAIL_OPTED_OUT: Property.Checkbox({
    displayName: 'Email Opted Out',
    required: false,
  }),
};

export const leadFields = {
    ...NameFields,
    LEAD_SOURCE_ID: Property.Number({
      displayName: 'Lead Source ID',
      required: true,
    }),
    LEAD_STATUS_ID: Property.Number({
      displayName: 'Lead Status ID',
      required: true,
    }),
    EMAIL: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    EMPLOYEE_COUNT: Property.Number({
        displayName: 'Employee Count',
        required: false,
    }),
    FAX: Property.ShortText({
        displayName: 'Fax',
        required: false,
    }),
    INDUSTRY: Property.ShortText({
        displayName: 'Industry',
        required: false,
    }),
    LEAD_DESCRIPTION: Property.LongText({
        displayName: 'Lead Description',
        required: false,
    }),
    LEAD_RATING: Property.Number({
        displayName: 'Lead Rating',
        required: false,
    }),
    MOBILE: Property.ShortText({
        displayName: 'Mobile',
        required: false,
    }),
    OWNER_USER_ID: Property.Number({
        displayName: 'Owner User ID',
        required: false,
    }),
    PHONE: Property.ShortText({
        displayName: 'Phone',
        required: false,
    }),
    RESPONSIBLE_USER_ID: Property.Number({
        displayName: 'Responsible User ID',
        required: false,
    }),
    WEBSITE: Property.ShortText({
        displayName: 'Website',
        required: false,
    }),
    ADDRESS_STREET: Property.ShortText({
        displayName: 'Street',
        required: false,
    }),
    ADDRESS_CITY: Property.ShortText({
        displayName: 'City',
        required: false,
    }),
    ADDRESS_STATE: Property.ShortText({
        displayName: 'State',
        required: false,
    }),
    ADDRESS_POSTCODE: Property.ShortText({
        displayName: 'Postcode',
        required: false,
    }),
    ADDRESS_COUNTRY: Property.ShortText({
        displayName: 'Country',
        required: false,
    }),
    ORGANISATION_NAME: Property.ShortText({
        displayName: 'Organization Name',
        required: false,
    }),
    EMAIL_OPTED_OUT: Property.Checkbox({
        displayName: 'Email Opted Out',
        required: false,
    }),
};

// TODO: Define fields when API documentation is available
export const opportunityFields = {
    OPPORTUNITY_NAME: Property.ShortText({
        displayName: 'Opportunity Name',
        required: true,
    }),
    OPPORTUNITY_DETAILS: Property.LongText({
        displayName: 'Opportunity Details',
        required: false,
    }),
    OPPORTUNITY_STATE: Property.StaticDropdown({
        displayName: 'Opportunity State',
        required: false,
        options: {
            options: [
                { label: 'Open', value: 'Open' },
                { label: 'Suspended', value: 'Suspended' },
                { label: 'Abandoned', value: 'Abandoned' },
                { label: 'Lost', value: 'Lost' },
                { label: 'Won', value: 'Won' },
            ]
        }
    }),
    RESPONSIBLE_USER_ID: Property.Number({
        displayName: 'Responsible User ID',
        required: false,
    }),
    CATEGORY_ID: Property.Number({
        displayName: 'Category ID',
        required: false,
    }),
    BID_CURRENCY: Property.ShortText({
        displayName: 'Bid Currency',
        description: '3-letter currency code (e.g., USD)',
        required: false,
    }),
    BID_AMOUNT: Property.Number({
        displayName: 'Bid Amount',
        required: false,
    }),
    BID_TYPE: Property.ShortText({
        displayName: 'Bid Type',
        description: 'e.g., "Fixed Bid", "Per Hour"',
        required: false,
    }),
    BID_DURATION: Property.Number({
        displayName: 'Bid Duration',
        required: false,
    }),
    PROBABILITY: Property.Number({
        displayName: 'Probability',
        description: 'Value from 0 to 100',
        required: false,
    }),
    FORECAST_CLOSE_DATE: Property.ShortText({
        displayName: 'Forecast Close Date',
        description: 'Format: YYYY-MM-DD',
        required: false,
    }),
    OWNER_USER_ID: Property.Number({
        displayName: 'Owner User ID',
        required: false,
    }),
    ORGANISATION_ID: Property.Number({
        displayName: 'Organization ID',
        required: false,
    }),
    PIPELINE_ID: Property.Number({
        displayName: 'Pipeline ID',
        required: false,
    }),
    STAGE_ID: Property.Number({
        displayName: 'Stage ID',
        required: false,
    }),
    PRICEBOOK_ID: Property.Number({
        displayName: 'Pricebook ID',
        required: false,
    }),
};
export const organisationFields = {
    ORGANISATION_NAME: Property.ShortText({
        displayName: 'Organisation Name',
        required: true,
    }),
    BACKGROUND: Property.LongText({
        displayName: 'Background',
        required: false,
    }),
    PHONE: Property.ShortText({
        displayName: 'Phone',
        required: false,
    }),
    PHONE_FAX: Property.ShortText({
        displayName: 'Fax',
        required: false,
    }),
    WEBSITE: Property.ShortText({
        displayName: 'Website',
        required: false,
    }),
    ADDRESS_BILLING_STREET: Property.ShortText({
        displayName: 'Billing Street',
        required: false,
    }),
    ADDRESS_BILLING_CITY: Property.ShortText({
        displayName: 'Billing City',
        required: false,
    }),
    ADDRESS_BILLING_STATE: Property.ShortText({
        displayName: 'Billing State',
        required: false,
    }),
    ADDRESS_BILLING_POSTCODE: Property.ShortText({
        displayName: 'Billing Postcode',
        required: false,
    }),
    ADDRESS_BILLING_COUNTRY: Property.ShortText({
        displayName: 'Billing Country',
        required: false,
    }),
    ADDRESS_SHIP_STREET: Property.ShortText({
        displayName: 'Shipping Street',
        required: false,
    }),
    ADDRESS_SHIP_CITY: Property.ShortText({
        displayName: 'Shipping City',
        required: false,
    }),
    ADDRESS_SHIP_STATE: Property.ShortText({
        displayName: 'Shipping State',
        required: false,
    }),
    ADDRESS_SHIP_POSTCODE: Property.ShortText({
        displayName: 'Shipping Postcode',
        required: false,
    }),
    ADDRESS_SHIP_COUNTRY: Property.ShortText({
        displayName: 'Shipping Country',
        required: false,
    }),
    SOCIAL_LINKEDIN: Property.ShortText({
        displayName: 'LinkedIn',
        required: false,
    }),
    SOCIAL_FACEBOOK: Property.ShortText({
        displayName: 'Facebook',
        required: false,
    }),
    SOCIAL_TWITTER: Property.ShortText({
        displayName: 'Twitter',
        required: false,
    }),
    OWNER_USER_ID: Property.Number({
        displayName: 'Owner User ID',
        required: false,
    }),
};
export const projectFields = {
    PROJECT_NAME: Property.ShortText({
        displayName: 'Project Name',
        required: true,
    }),
    STATUS: Property.StaticDropdown({
        displayName: 'Status',
        required: true,
        options: {
            options: [
                { label: 'Not Started', value: 'NOT STARTED' },
                { label: 'In Progress', value: 'IN PROGRESS' },
                { label: 'On Hold', value: 'ON HOLD' },
                { label: 'Completed', value: 'COMPLETED' },
                { label: 'Cancelled', value: 'CANCELLED' },
            ]
        }
    }),
    PROJECT_DETAILS: Property.LongText({
        displayName: 'Project Details',
        required: false,
    }),
    STARTED_DATE: Property.ShortText({
        displayName: 'Started Date',
        description: 'Format: YYYY-MM-DD',
        required: false,
    }),
    COMPLETED_DATE: Property.ShortText({
        displayName: 'Completed Date',
        description: 'Format: YYYY-MM-DD',
        required: false,
    }),
    OPPORTUNITY_ID: Property.Number({
        displayName: 'Opportunity ID',
        required: false,
    }),
    CATEGORY_ID: Property.Number({
        displayName: 'Category ID',
        required: false,
    }),
    PIPELINE_ID: Property.Number({
        displayName: 'Pipeline ID',
        required: false,
    }),
    STAGE_ID: Property.Number({
        displayName: 'Stage ID',
        required: false,
    }),
    OWNER_USER_ID: Property.Number({
        displayName: 'Owner User ID',
        required: false,
    }),
    RESPONSIBLE_USER_ID: Property.Number({
        displayName: 'Responsible User ID',
        required: false,
    }),
};
export const taskFields = {
    TITLE: Property.ShortText({
        displayName: 'Title',
        required: true,
    }),
    STATUS: Property.StaticDropdown({
        displayName: 'Status',
        required: false,
        options: {
            options: [
                { label: 'Not Started', value: 'NOT STARTED' },
                { label: 'In Progress', value: 'IN PROGRESS' },
                { label: 'Waiting', value: 'WAITING' },
                { label: 'Completed', value: 'COMPLETED' },
                { label: 'Deferred', value: 'DEFERRED' },
            ]
        }
    }),
    DETAILS: Property.LongText({
        displayName: 'Details',
        required: false,
    }),
    START_DATE: Property.ShortText({
        displayName: 'Start Date',
        description: 'Format: YYYY-MM-DD',
        required: false,
    }),
    DUE_DATE: Property.ShortText({
        displayName: 'Due Date',
        description: 'Format: YYYY-MM-DD',
        required: false,
    }),
    PERCENT_COMPLETE: Property.Number({
        displayName: 'Percent Complete',
        required: false,
    }),
    PRIORITY: Property.Number({
        displayName: 'Priority',
        description: '1 (Low), 2 (Normal), 3 (High)',
        required: false,
    }),
    COMPLETED: Property.Checkbox({
        displayName: 'Completed',
        required: false,
    }),
    OWNER_USER_ID: Property.Number({
        displayName: 'Owner User ID',
        required: true,
    }),
    RESPONSIBLE_USER_ID: Property.Number({
        displayName: 'Responsible User ID',
        required: false,
    }),
    PROJECT_ID: Property.Number({
        displayName: 'Project ID',
        required: false,
    }),
    OPPORTUNITY_ID: Property.Number({
        displayName: 'Opportunity ID',
        required: false,
    }),
    CATEGORY_ID: Property.Number({
        displayName: 'Category ID',
        required: false,
    }),
    MILESTONE_ID: Property.Number({
        displayName: 'Milestone ID',
        required: false,
    }),
};
export const eventFields = {
    TITLE: Property.ShortText({
        displayName: 'Title',
        required: true,
    }),
    LOCATION: Property.ShortText({
        displayName: 'Location',
        required: false,
    }),
    START_DATE_UTC: Property.ShortText({
        displayName: 'Start Date (UTC)',
        description: 'Format: YYYY-MM-DDTHH:MM:SSZ',
        required: true,
    }),
    END_DATE_UTC: Property.ShortText({
        displayName: 'End Date (UTC)',
        description: 'Format: YYYY-MM-DDTHH:MM:SSZ',
        required: true,
    }),
    ALL_DAY: Property.Checkbox({
        displayName: 'All Day',
        required: false,
    }),
    DETAILS: Property.LongText({
        displayName: 'Details',
        required: false,
    }),
    OWNER_USER_ID: Property.Number({
        displayName: 'Owner User ID',
        required: false,
    }),
};
export const noteFields = {
    TITLE: Property.ShortText({
        displayName: 'Title',
        required: true,
    }),
    BODY: Property.LongText({
        displayName: 'Body',
        required: false,
    }),
};
export const productFields = {
    PRODUCT_NAME: Property.ShortText({
        displayName: 'Product Name',
        required: true,
    }),
    PRODUCT_CODE: Property.ShortText({
        displayName: 'Product Code',
        required: false,
    }),
    PRODUCT_SKU: Property.ShortText({
        displayName: 'Product SKU',
        required: false,
    }),
    DESCRIPTION: Property.LongText({
        displayName: 'Description',
        required: false,
    }),
    PRODUCT_FAMILY: Property.ShortText({
        displayName: 'Product Family',
        required: false,
    }),
    PRODUCT_IMAGE_URL: Property.ShortText({
        displayName: 'Product Image URL',
        required: false,
    }),
    DEFAULT_PRICE: Property.Number({
        displayName: 'Default Price',
        required: false,
    }),
    ACTIVE: Property.Checkbox({
        displayName: 'Active',
        required: false,
    }),
    OWNER_USER_ID: Property.Number({
        displayName: 'Owner User ID',
        required: false,
    }),
    CURRENCY_CODE: Property.ShortText({
        displayName: 'Currency Code',
        description: '3-letter currency code (e.g., USD)',
        required: false,
    }),
};
export const quotationFields = {
    QUOTATION_NAME: Property.ShortText({
        displayName: 'Quotation Name',
        required: true,
    }),
    OPPORTUNITY_ID: Property.Number({
        displayName: 'Opportunity ID',
        required: true,
    }),
    QUOTE_STATUS: Property.StaticDropdown({
        displayName: 'Quote Status',
        required: false,
        options: {
            options: [
                { label: 'Draft', value: 'Draft' },
                { label: 'Awaiting Approval', value: 'Awaiting Approval' },
                { label: 'Approved', value: 'Approved' },
                { label: 'Sent', value: 'Sent' },
                { label: 'Accepted', value: 'Accepted' },
                { label: 'Declined', value: 'Declined' },
            ]
        }
    }),
    QUOTATION_DESCRIPTION: Property.LongText({
        displayName: 'Description',
        required: false,
    }),
    QUOTATION_EXPIRATION_DATE: Property.ShortText({
        displayName: 'Expiration Date',
        description: 'Format: YYYY-MM-DD',
        required: false,
    }),
    CONTACT_ID: Property.Number({
        displayName: 'Contact ID',
        required: false,
    }),
    ORGANISATION_ID: Property.Number({
        displayName: 'Organisation ID',
        required: false,
    }),
    PRICEBOOK_ID: Property.Number({
        displayName: 'Pricebook ID',
        required: false,
    }),
    QUOTATION_PHONE: Property.ShortText({
        displayName: 'Phone',
        required: false,
    }),
    QUOTATION_EMAIL: Property.ShortText({
        displayName: 'Email',
        required: false,
    }),
    QUOTATION_FAX: Property.ShortText({
        displayName: 'Fax',
        required: false,
    }),
    SHIPPING_HANDLING: Property.Number({
        displayName: 'Shipping & Handling',
        required: false,
    }),
    TAX: Property.Number({
        displayName: 'Tax',
        required: false,
    }),
    ADDRESS_BILLING_NAME: Property.ShortText({
        displayName: 'Billing Name',
        required: false,
    }),
    ADDRESS_BILLING_STREET: Property.ShortText({
        displayName: 'Billing Street',
        required: false,
    }),
    ADDRESS_BILLING_CITY: Property.ShortText({
        displayName: 'Billing City',
        required: false,
    }),
    ADDRESS_BILLING_STATE: Property.ShortText({
        displayName: 'Billing State',
        required: false,
    }),
    ADDRESS_BILLING_POSTCODE: Property.ShortText({
        displayName: 'Billing Postcode',
        required: false,
    }),
    ADDRESS_BILLING_COUNTRY: Property.ShortText({
        displayName: 'Billing Country',
        required: false,
    }),
    ADDRESS_SHIPPING_NAME: Property.ShortText({
        displayName: 'Shipping Name',
        required: false,
    }),
    ADDRESS_SHIPPING_STREET: Property.ShortText({
        displayName: 'Shipping Street',
        required: false,
    }),
    ADDRESS_SHIPPING_CITY: Property.ShortText({
        displayName: 'Shipping City',
        required: false,
    }),
    ADDRESS_SHIPPING_STATE: Property.ShortText({
        displayName: 'Shipping State',
        required: false,
    }),
    ADDRESS_SHIPPING_POSTCODE: Property.ShortText({
        displayName: 'Shipping Postcode',
        required: false,
    }),
    ADDRESS_SHIPPING_COUNTRY: Property.ShortText({
        displayName: 'Shipping Country',
        required: false,
    }),
};

