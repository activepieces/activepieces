import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../auth';
import { chargekeepClient } from '../common/client';
import { chargekeepServices } from '../common/services';
import { contactCommon } from '../common/contact';
import { chargekeepOutputSchemas } from '../common/output-schemas';

export const addOrUpdateContactExtended = createAction({
  name: 'addOrUpdateContact(extended)',
  classification: 'WRITE',
  displayName: 'Add or Update Contact (Extended)',
  description: 'Adds or updates a contact with every field ChargeKeep supports.',
  audience: 'human',
  aiMetadata: { description: 'Imports a contact into the ChargeKeep/Sperse CRM with the full field set (driving license, military/citizenship flags, company details, tracking/UTM data, custom fields, and up to three inline subscriptions), upserting by Contact ID, Contact XREF, or email/name match. Prefer this over the basic Add or Update Contact when you need those extra fields. Can also provision a portal user and send a welcome email when Create User / Send Welcome Email are enabled (that email is a one-time side effect); otherwise repeating with the same identifying input upserts the same contact.', idempotent: false },
  auth: chargekeepAuth,
  outputSchema: chargekeepOutputSchemas.importedContact,
  props: {
    identity_info: Property.MarkDown({
      value: 'Give at least a name, a company or an email, or a Contact ID or External Contact ID. Empty fields are not sent, so an update keeps what ChargeKeep already has.',
      variant: MarkdownVariant.INFO,
    }),
    portal_user_info: Property.MarkDown({
      value: 'Welcome Email and Password only apply when Create User is Yes.',
      variant: MarkdownVariant.INFO,
    }),
    matchExisting: Property.StaticDropdown({
      displayName: 'Match Existing Contact',
      description: 'Yes updates the contact with the same email and name.',
      required: false,
      defaultValue: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'Yes',
            value: true,
          },
          {
            label: 'No',
            value: false,
          },
        ],
      },
    }),
    overrideLists: Property.StaticDropdown({
      displayName: 'Replace Lists',
      description: 'Yes replaces emails, phones, tags and lists instead of adding to them.',
      required: false,
      defaultValue: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Yes',
            value: true,
          },
          {
            label: 'No',
            value: false,
          },
        ],
      },
    }),
    ignoreInvalidValues: Property.StaticDropdown({
      displayName: 'Ignore Invalid Values',
      description: 'Yes saves the contact even when some values are invalid.',
      required: false,
      defaultValue: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'Yes',
            value: true,
          },
          {
            label: 'No',
            value: false,
          },
        ],
      },
    }),
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'ChargeKeep ID of the contact to update. Empty: match or create.',
      width: 'half',
      required: false,
    }),
    contactXref: Property.ShortText({
      displayName: 'External Contact ID',
      description: 'Your own ID for the contact (XREF in ChargeKeep).',
      width: 'half',
      required: false,
    }),
    importType: Property.StaticDropdown({
      displayName: 'Contact Type',
      required: true,
      defaultValue: 'Lead',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'Lead',
            value: 'Lead',
            description: 'Potential buyer',
            icon: 'user',
          },
          {
            label: 'Client',
            value: 'Client',
            description: 'Paying customer',
            icon: 'users',
          },
          {
            label: 'Partner',
            value: 'Partner',
            description: 'Works with you',
            icon: 'tag',
          },
        ],
      },
    }),
    createUser: Property.StaticDropdown({
      displayName: 'Create User',
      description: 'Yes gives the contact a portal login, using their personal email.',
      required: false,
      defaultValue: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Yes',
            value: true,
          },
          {
            label: 'No',
            value: false,
          },
        ],
      },
    }),
    sendWelcomeEmail: Property.StaticDropdown({
      displayName: 'Send Welcome Email',
      required: false,
      defaultValue: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Yes',
            value: true,
          },
          {
            label: 'No',
            value: false,
          },
        ],
      },
    }),
    userPassword: Property.ShortText({
      displayName: 'User Password',
      description: 'Empty: a password is generated.',
      required: false,
    }),
    namePrefix: Property.ShortText({
      displayName: 'Prefix',
      placeholder: 'Dr.',
      width: 'half',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      width: 'half',
      required: false,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      width: 'half',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      width: 'half',
      required: false,
    }),
    nickName: Property.ShortText({
      displayName: 'Nickname',
      width: 'half',
      required: false,
    }),
    nameSuffix: Property.ShortText({
      displayName: 'Suffix',
      placeholder: 'PhD',
      width: 'half',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      width: 'half',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Male',
            value: 'Male',
          },
          {
            label: 'Female',
            value: 'Female',
          },
        ],
      },
    }),
    dob: Property.ShortText({
      displayName: 'Date of Birth',
      placeholder: '1990-06-25',
      width: 'half',
      required: false,
    }),
    bankCode: Property.ShortText({
      displayName: 'Bank Code',
      description: "The contact's 4-letter personality code.",
      width: 'half',
      required: false,
    }),
    ssn: Property.ShortText({
      displayName: 'SSN',
      description: "The contact's social security number.",
      width: 'half',
      required: false,
    }),
    drivingLicense: Property.ShortText({
      displayName: "Driver's License",
      width: 'half',
      required: false,
    }),
    drivingLicenseState: Property.ShortText({
      displayName: 'License State',
      width: 'half',
      required: false,
    }),
    isActiveMilitaryDuty: Property.StaticDropdown({
      displayName: 'Active Military Duty',
      description: 'Empty means unknown.',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Yes',
            value: true,
          },
          {
            label: 'No',
            value: false,
          },
        ],
      },
    }),
    isUSCitizen: Property.StaticDropdown({
      displayName: 'US Citizen',
      description: 'Empty means unknown.',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Yes',
            value: true,
          },
          {
            label: 'No',
            value: false,
          },
        ],
      },
    }),
    preferredToD: Property.StaticDropdown({
      displayName: 'Preferred Time of Day',
      description: 'Best time of day to contact them.',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Morning',
            value: 'Morning',
          },
          {
            label: 'Afternoon',
            value: 'Afternoon',
          },
          {
            label: 'Evening',
            value: 'Evening',
          },
          {
            label: 'Anytime',
            value: 'Anytime',
          },
        ],
      },
    }),
    personAffiliateCode: Property.ShortText({
      displayName: 'Contact Affiliate Code',
      description: "The contact's own referral code: letters, digits, _ and -.",
      required: false,
    }),
    email1: Property.LongText({
      displayName: 'Personal Email',
      required: false,
    }),
    email2: Property.LongText({
      displayName: 'Alternative Personal Email',
      required: false,
    }),
    email3: Property.LongText({
      displayName: 'Other Personal Email',
      required: false,
    }),
    workEmail1: Property.LongText({
      displayName: 'Work Email',
      required: false,
    }),
    workEmail2: Property.LongText({
      displayName: 'Alternative Work Email',
      required: false,
    }),
    workEmail3: Property.LongText({
      displayName: 'Other Work Email',
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      width: 'half',
      required: false,
    }),
    mobilePhoneExt: Property.ShortText({
      displayName: 'Mobile Phone Ext',
      width: 'half',
      required: false,
    }),
    homePhone: Property.ShortText({
      displayName: 'Home Phone',
      width: 'half',
      required: false,
    }),
    homePhoneExt: Property.ShortText({
      displayName: 'Home Phone Ext',
      width: 'half',
      required: false,
    }),
    workPhone1: Property.ShortText({
      displayName: 'Work Phone',
      width: 'half',
      required: false,
    }),
    workPhone1Ext: Property.ShortText({
      displayName: 'Work Phone Ext',
      width: 'half',
      required: false,
    }),
    workPhone2: Property.ShortText({
      displayName: 'Work Phone 2',
      width: 'half',
      required: false,
    }),
    workPhone2Ext: Property.ShortText({
      displayName: 'Work Phone 2 Ext',
      width: 'half',
      required: false,
    }),
    home_street: Property.LongText({
      displayName: 'Street',
      required: false,
    }),
    home_addressLine2: Property.LongText({
      displayName: 'Address Line 2',
      required: false,
    }),
    home_city: Property.LongText({
      displayName: 'City',
      required: false,
    }),
    home_stateName: Property.ShortText({
      displayName: 'State Name',
      width: 'half',
      required: false,
    }),
    home_stateId: Property.ShortText({
      displayName: 'State Code',
      description: 'Two-letter state code.',
      placeholder: 'CA',
      width: 'half',
      required: false,
    }),
    home_zip: Property.ShortText({
      displayName: 'ZIP Code',
      width: 'half',
      required: false,
    }),
    home_countryName: Property.ShortText({
      displayName: 'Country Name',
      required: false,
    }),
    home_countryId: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter country code.',
      placeholder: 'US',
      width: 'half',
      required: false,
    }),
    work_street: Property.LongText({
      displayName: 'Street',
      required: false,
    }),
    work_addressLine2: Property.LongText({
      displayName: 'Address Line 2',
      required: false,
    }),
    work_city: Property.LongText({
      displayName: 'City',
      required: false,
    }),
    work_stateName: Property.ShortText({
      displayName: 'State Name',
      width: 'half',
      required: false,
    }),
    work_stateId: Property.ShortText({
      displayName: 'State Code',
      description: 'Two-letter state code.',
      placeholder: 'CA',
      width: 'half',
      required: false,
    }),
    work_zip: Property.ShortText({
      displayName: 'ZIP Code',
      width: 'half',
      required: false,
    }),
    work_countryName: Property.ShortText({
      displayName: 'Country Name',
      required: false,
    }),
    work_countryId: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter country code.',
      placeholder: 'US',
      width: 'half',
      required: false,
    }),
    webSiteUrl: Property.LongText({
      displayName: 'Website',
      required: false,
    }),
    linkedInUrl: Property.LongText({
      displayName: 'LinkedIn',
      description: "Link to the contact's LinkedIn profile.",
      required: false,
    }),
    photoUrl: Property.LongText({
      displayName: 'Photo URL',
      required: false,
    }),
    facebookUrl: Property.LongText({
      displayName: 'Facebook',
      description: "Link to the contact's Facebook profile.",
      width: 'half',
      required: false,
    }),
    instagramUrl: Property.LongText({
      displayName: 'Instagram',
      description: "Link to the contact's Instagram profile.",
      width: 'half',
      required: false,
    }),
    twitterUrl: Property.LongText({
      displayName: 'Twitter',
      description: "Link to the contact's Twitter profile.",
      width: 'half',
      required: false,
    }),
    googlePlusUrl: Property.LongText({
      displayName: 'Google Reviews',
      description: "Link to the contact's Google reviews.",
      width: 'half',
      required: false,
    }),
    angelListUrl: Property.LongText({
      displayName: 'AngelList',
      description: "Link to the contact's AngelList profile.",
      width: 'half',
      required: false,
    }),
    zoomUrl: Property.LongText({
      displayName: 'Zoom',
      description: "The contact's Zoom link.",
      width: 'half',
      required: false,
    }),
    experience: Property.LongText({
      displayName: 'Experience',
      description: "The contact's work history or professional background.",
      required: false,
    }),
    profileSummary: Property.LongText({
      displayName: 'Profile Summary',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    followUpDate: Property.ShortText({
      displayName: 'Follow-Up Date',
      description: 'Creates a follow-up task for this date.',
      placeholder: '2026-06-25 14:30:00',
      required: false,
    }),
    assignedUser: Property.ShortText({
      displayName: 'Assigned User',
      description: 'Email or username of the ChargeKeep user who owns this contact.',
      required: false,
    }),
    leadDealAmount: Property.Number({
      displayName: 'Deal Amount',
      description: 'Estimated value of the deal.',
      width: 'half',
      required: false,
    }),
    customField1: Property.LongText({
      displayName: 'Custom Field 1',
      advanced: true,
      required: false,
    }),
    customField2: Property.LongText({
      displayName: 'Custom Field 2',
      advanced: true,
      required: false,
    }),
    customField3: Property.LongText({
      displayName: 'Custom Field 3',
      advanced: true,
      required: false,
    }),
    customField4: Property.LongText({
      displayName: 'Custom Field 4',
      advanced: true,
      required: false,
    }),
    customField5: Property.LongText({
      displayName: 'Custom Field 5',
      advanced: true,
      required: false,
    }),
    companyName: Property.LongText({
      displayName: 'Company Name',
      required: false,
    }),
    organizationType: Property.StaticDropdown({
      displayName: 'Organization Type',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'LLP',
            value: 'LLP',
          },
          {
            label: 'LLC',
            value: 'LLC',
          },
          {
            label: 'Inc',
            value: 'Inc',
          },
          {
            label: 'LP',
            value: 'LP',
          },
          {
            label: 'Partnership',
            value: 'Partnership',
          },
          {
            label: 'Sole Proprietorship',
            value: 'Sole Proprietership',
          },
          {
            label: 'Trust',
            value: 'Trust',
          },
          {
            label: 'LLLP',
            value: 'LLLP',
          },
          {
            label: 'Other',
            value: 'Other',
          },
        ],
      },
    }),
    isEmployed: Property.StaticDropdown({
      displayName: 'Employed Here',
      description: 'Whether the contact works at this company.',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Yes',
            value: true,
          },
          {
            label: 'No',
            value: false,
          },
        ],
      },
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    employmentStartDate: Property.ShortText({
      displayName: 'Employment Start Date',
      placeholder: '2024-06-25',
      required: false,
    }),
    employeeCount: Property.ShortText({
      displayName: 'Employee Count',
      width: 'half',
      required: false,
    }),
    dateFounded: Property.ShortText({
      displayName: 'Date Founded',
      placeholder: '2024-06-25',
      width: 'half',
      required: false,
    }),
    ein: Property.LongText({
      displayName: 'EIN',
      required: false,
    }),
    annualRevenue: Property.Number({
      displayName: 'Annual Revenue',
      width: 'half',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      width: 'half',
      required: false,
    }),
    companyPhone: Property.ShortText({
      displayName: 'Company Phone',
      width: 'half',
      required: false,
    }),
    companyPhoneExt: Property.ShortText({
      displayName: 'Company Phone Ext',
      width: 'half',
      required: false,
    }),
    companyFaxNumber: Property.LongText({
      displayName: 'Company Fax',
      required: false,
    }),
    companyEmail: Property.LongText({
      displayName: 'Company Email',
      required: false,
    }),
    companyWebSiteUrl: Property.LongText({
      displayName: 'Company Website',
      required: false,
    }),
    companyFacebookUrl: Property.LongText({
      displayName: 'Company Facebook',
      required: false,
    }),
    companyLinkedInUrl: Property.LongText({
      displayName: 'Company LinkedIn',
      required: false,
    }),
    companyInstagramUrl: Property.LongText({
      displayName: 'Company Instagram',
      required: false,
    }),
    companyTwitterUrl: Property.LongText({
      displayName: 'Company Twitter',
      required: false,
    }),
    companyGooglePlusUrl: Property.LongText({
      displayName: 'Company Google Reviews',
      required: false,
    }),
    companyCrunchbaseUrl: Property.LongText({
      displayName: 'Company Crunchbase',
      required: false,
    }),
    companyBBBUrl: Property.LongText({
      displayName: 'Company BBB URL',
      required: false,
    }),
    companyZoomUrl: Property.LongText({
      displayName: 'Company Zoom',
      required: false,
    }),
    companyCalendlyUrl: Property.LongText({
      displayName: 'Company Calendly',
      required: false,
    }),
    companyLogoUrl: Property.LongText({
      displayName: 'Company Logo URL',
      required: false,
    }),
    companyAffiliateCode: Property.ShortText({
      displayName: 'Company Affiliate Code',
      required: false,
    }),
    company_street: Property.LongText({
      displayName: 'Street',
      required: false,
    }),
    company_addressLine2: Property.LongText({
      displayName: 'Address Line 2',
      required: false,
    }),
    company_city: Property.ShortText({
      displayName: 'City',
      width: 'half',
      required: false,
    }),
    company_stateName: Property.ShortText({
      displayName: 'State Name',
      width: 'half',
      required: false,
    }),
    company_stateId: Property.ShortText({
      displayName: 'State Code',
      placeholder: 'CA',
      width: 'half',
      required: false,
    }),
    company_zip: Property.ShortText({
      displayName: 'ZIP Code',
      width: 'half',
      required: false,
    }),
    company_countryName: Property.LongText({
      displayName: 'Country Name',
      required: false,
    }),
    company_countryId: Property.ShortText({
      displayName: 'Country Code',
      placeholder: 'US',
      required: false,
    }),
    leadSource: Property.ShortText({
      displayName: 'Source Code',
      description: 'Where the contact first found you, such as google or newsletter.',
      width: 'half',
      required: false,
    }),
    channelId: Property.ShortText({
      displayName: 'Channel Code',
      description: 'How the contact reached you, such as email or paid search.',
      width: 'half',
      required: false,
    }),
    affiliateCode: Property.ShortText({
      displayName: 'Affiliate Code',
      description: 'Code of the affiliate partner who referred the contact.',
      required: false,
    }),
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      advanced: true,
      required: false,
    }),
    gclId: Property.ShortText({
      displayName: 'Google Click ID',
      advanced: true,
      required: false,
    }),
    refererURL: Property.LongText({
      displayName: 'Referrer URL',
      description: 'The page whose link brought the contact to your website.',
      required: false,
    }),
    applicantId: Property.ShortText({
      displayName: 'Applicant ID',
      advanced: true,
      required: false,
    }),
    applicationId: Property.ShortText({
      displayName: 'Application ID',
      advanced: true,
      required: false,
    }),
    ipAddress: Property.LongText({
      displayName: 'IP Address',
      advanced: true,
      required: false,
    }),
    userAgent: Property.ShortText({
      displayName: 'User Agent',
      advanced: true,
      required: false,
    }),
    siteId: Property.ShortText({
      displayName: 'Site ID',
      advanced: true,
      required: false,
    }),
    siteUrl: Property.LongText({
      displayName: 'Site URL',
      advanced: true,
      required: false,
    }),
    dateCreated: Property.ShortText({
      displayName: 'Date Created',
      placeholder: '2026-06-25 14:30:00',
      advanced: true,
      required: false,
    }),
    entryUrl: Property.LongText({
      displayName: 'Entry URL',
      description: 'The first page the contact visited on your website.',
      required: false,
    }),
    leadStageName: Property.ShortText({
      displayName: 'Lead Stage Name',
      description: 'Pipeline stage to put the lead in.',
      width: 'half',
      required: false,
    }),
    star: Property.ShortText({
      displayName: 'Star',
      description: 'Yellow, Blue, Green, Purple or Red. Other values are skipped.',
      width: 'half',
      required: false,
    }),
    rating: Property.ShortText({
      displayName: 'Rating',
      description: 'A number from 1 to 10.',
      width: 'half',
      required: false,
    }),
    utmSource: Property.LongText({
      displayName: 'UTM Source',
      advanced: true,
      required: false,
    }),
    utmMedium: Property.LongText({
      displayName: 'UTM Medium',
      advanced: true,
      required: false,
    }),
    utmCampaign: Property.LongText({
      displayName: 'UTM Campaign',
      advanced: true,
      required: false,
    }),
    utmTerm: Property.LongText({
      displayName: 'UTM Term',
      advanced: true,
      required: false,
    }),
    utmContent: Property.LongText({
      displayName: 'UTM Content',
      advanced: true,
      required: false,
    }),
    utmKeyword: Property.LongText({
      displayName: 'UTM Keyword',
      advanced: true,
      required: false,
    }),
    utmAdGroup: Property.LongText({
      displayName: 'UTM AdGroup',
      advanced: true,
      required: false,
    }),
    utmName: Property.LongText({
      displayName: 'UTM Name',
      advanced: true,
      required: false,
    }),
    requestCustomField1: Property.LongText({
      displayName: 'Request Custom Field 1',
      advanced: true,
      required: false,
    }),
    requestCustomField2: Property.LongText({
      displayName: 'Request Custom Field 2',
      advanced: true,
      required: false,
    }),
    requestCustomField3: Property.LongText({
      displayName: 'Request Custom Field 3',
      advanced: true,
      required: false,
    }),
    requestCustomField4: Property.LongText({
      displayName: 'Request Custom Field 4',
      advanced: true,
      required: false,
    }),
    requestCustomField5: Property.LongText({
      displayName: 'Request Custom Field 5',
      advanced: true,
      required: false,
    }),
    sub1_productCode: Property.ShortText({
      displayName: 'Product Code',
      description: 'Product SKU. Give it with Billing Period, or System Type and Code.',
      width: 'half',
      required: false,
    }),
    sub1_paymentPeriodType: Property.StaticDropdown({
      displayName: 'Billing Period',
      description: 'Must be a period set up on the product in ChargeKeep.',
      width: 'half',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Monthly',
            value: 'Monthly',
          },
          {
            label: 'Annual',
            value: 'Annual',
          },
          {
            label: 'Lifetime',
            value: 'LifeTime',
          },
        ],
      },
    }),
    sub1_systemType: Property.ShortText({
      displayName: 'System Type',
      width: 'half',
      required: false,
    }),
    sub1_code: Property.ShortText({
      displayName: 'Code',
      description: 'Service code from ChargeKeep.',
      width: 'half',
      required: false,
    }),
    sub1_name: Property.ShortText({
      displayName: 'Name',
      width: 'half',
      required: false,
    }),
    sub1_level: Property.ShortText({
      displayName: 'Level',
      description: 'Service level code from ChargeKeep.',
      width: 'half',
      required: false,
    }),
    sub1_startDate: Property.ShortText({
      displayName: 'Start Date',
      placeholder: '2026-06-25 00:00:00',
      required: false,
    }),
    sub1_endDate: Property.ShortText({
      displayName: 'End Date',
      placeholder: '2026-06-25 00:00:00',
      required: false,
    }),
    sub1_amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    sub2_productCode: Property.ShortText({
      displayName: 'Product Code',
      description: 'Product SKU. Give it with Billing Period, or System Type and Code.',
      width: 'half',
      required: false,
    }),
    sub2_paymentPeriodType: Property.StaticDropdown({
      displayName: 'Billing Period',
      description: 'Must be a period set up on the product in ChargeKeep.',
      width: 'half',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Monthly',
            value: 'Monthly',
          },
          {
            label: 'Annual',
            value: 'Annual',
          },
          {
            label: 'Lifetime',
            value: 'LifeTime',
          },
        ],
      },
    }),
    sub2_systemType: Property.ShortText({
      displayName: 'System Type',
      width: 'half',
      required: false,
    }),
    sub2_code: Property.ShortText({
      displayName: 'Code',
      description: 'Service code from ChargeKeep.',
      width: 'half',
      required: false,
    }),
    sub2_name: Property.ShortText({
      displayName: 'Name',
      width: 'half',
      required: false,
    }),
    sub2_level: Property.ShortText({
      displayName: 'Level',
      description: 'Service level code from ChargeKeep.',
      width: 'half',
      required: false,
    }),
    sub2_startDate: Property.ShortText({
      displayName: 'Start Date',
      placeholder: '2026-06-25 00:00:00',
      required: false,
    }),
    sub2_endDate: Property.ShortText({
      displayName: 'End Date',
      placeholder: '2026-06-25 00:00:00',
      required: false,
    }),
    sub2_amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    sub3_productCode: Property.ShortText({
      displayName: 'Product Code',
      description: 'Product SKU. Give it with Billing Period, or System Type and Code.',
      width: 'half',
      required: false,
    }),
    sub3_paymentPeriodType: Property.StaticDropdown({
      displayName: 'Billing Period',
      description: 'Must be a period set up on the product in ChargeKeep.',
      width: 'half',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Monthly',
            value: 'Monthly',
          },
          {
            label: 'Annual',
            value: 'Annual',
          },
          {
            label: 'Lifetime',
            value: 'LifeTime',
          },
        ],
      },
    }),
    sub3_systemType: Property.ShortText({
      displayName: 'System Type',
      width: 'half',
      required: false,
    }),
    sub3_code: Property.ShortText({
      displayName: 'Code',
      description: 'Service code from ChargeKeep.',
      width: 'half',
      required: false,
    }),
    sub3_name: Property.ShortText({
      displayName: 'Name',
      width: 'half',
      required: false,
    }),
    sub3_level: Property.ShortText({
      displayName: 'Level',
      description: 'Service level code from ChargeKeep.',
      width: 'half',
      required: false,
    }),
    sub3_startDate: Property.ShortText({
      displayName: 'Start Date',
      placeholder: '2026-06-25 00:00:00',
      required: false,
    }),
    sub3_endDate: Property.ShortText({
      displayName: 'End Date',
      placeholder: '2026-06-25 00:00:00',
      required: false,
    }),
    sub3_amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
  },

  propertyGroups: [
    {
      key: 'record',
      display: 'section',
      label: 'Contact',
      icon: 'user',
      props: ['importType', 'identity_info', 'matchExisting', 'contactId', 'contactXref', 'overrideLists', 'ignoreInvalidValues'],
    },
    {
      key: 'portal_user',
      display: 'section',
      label: 'Portal User',
      icon: 'user',
      props: ['portal_user_info', 'createUser', 'sendWelcomeEmail', 'userPassword'],
    },
    {
      key: 'name',
      display: 'section',
      label: 'Name',
      icon: 'type',
      props: ['namePrefix', 'nameSuffix', 'firstName', 'lastName', 'middleName', 'nickName'],
    },
    {
      key: 'personal',
      display: 'section',
      label: 'Personal Details',
      icon: 'user',
      props: ['gender', 'dob', 'ssn', 'bankCode', 'drivingLicense', 'drivingLicenseState', 'isActiveMilitaryDuty', 'isUSCitizen', 'preferredToD'],
    },
    {
      key: 'emails',
      display: 'section',
      label: 'Emails',
      icon: 'inbox',
      props: ['email1', 'email2', 'email3', 'workEmail1', 'workEmail2', 'workEmail3'],
    },
    {
      key: 'phones',
      display: 'section',
      label: 'Phones',
      icon: 'send',
      props: ['mobilePhone', 'mobilePhoneExt', 'homePhone', 'homePhoneExt', 'workPhone1', 'workPhone1Ext', 'workPhone2', 'workPhone2Ext'],
    },
    {
      key: 'home_address',
      display: 'section',
      label: 'Home Address',
      icon: 'location',
      props: ['home_street', 'home_addressLine2', 'home_city', 'home_stateName', 'home_stateId', 'home_zip', 'home_countryId', 'home_countryName'],
    },
    {
      key: 'work_address',
      display: 'section',
      label: 'Work Address',
      icon: 'location',
      props: ['work_street', 'work_addressLine2', 'work_city', 'work_stateName', 'work_stateId', 'work_zip', 'work_countryId', 'work_countryName'],
    },
    {
      key: 'links',
      display: 'section',
      label: 'Profile Links',
      icon: 'send',
      props: ['webSiteUrl', 'linkedInUrl', 'photoUrl', 'facebookUrl', 'instagramUrl', 'twitterUrl', 'googlePlusUrl', 'angelListUrl', 'zoomUrl'],
    },
    {
      key: 'profile',
      display: 'section',
      label: 'Profile',
      icon: 'text',
      props: ['experience', 'profileSummary', 'notes'],
    },
    {
      key: 'company',
      display: 'section',
      label: 'Company',
      icon: 'users',
      props: ['companyName', 'organizationType', 'isEmployed', 'jobTitle', 'employmentStartDate', 'industry', 'employeeCount', 'dateFounded', 'annualRevenue', 'ein', 'companyAffiliateCode'],
    },
    {
      key: 'company_contact',
      display: 'section',
      label: 'Company Contact',
      icon: 'send',
      props: ['companyEmail', 'companyPhone', 'companyPhoneExt', 'companyFaxNumber'],
    },
    {
      key: 'company_links',
      display: 'section',
      label: 'Company Links',
      icon: 'send',
      props: ['companyWebSiteUrl', 'companyLogoUrl', 'companyLinkedInUrl', 'companyFacebookUrl', 'companyInstagramUrl', 'companyTwitterUrl', 'companyGooglePlusUrl', 'companyCrunchbaseUrl', 'companyBBBUrl', 'companyZoomUrl', 'companyCalendlyUrl'],
    },
    {
      key: 'company_address',
      display: 'section',
      label: 'Company Address',
      icon: 'location',
      props: ['company_street', 'company_addressLine2', 'company_city', 'company_zip', 'company_stateName', 'company_stateId', 'company_countryName', 'company_countryId'],
    },
    {
      key: 'crm',
      display: 'section',
      label: 'Sales',
      icon: 'sliders',
      props: ['followUpDate', 'assignedUser', 'leadStageName', 'leadDealAmount', 'star', 'rating'],
    },
    {
      key: 'marketing',
      display: 'section',
      label: 'Marketing',
      icon: 'tag',
      props: ['leadSource', 'channelId', 'affiliateCode', 'personAffiliateCode', 'refererURL', 'entryUrl'],
    },
    {
      key: 'subscription_1',
      display: 'section',
      label: 'Subscription 1',
      icon: 'calendar',
      props: ['sub1_productCode', 'sub1_paymentPeriodType', 'sub1_systemType', 'sub1_code', 'sub1_name', 'sub1_level', 'sub1_startDate', 'sub1_endDate', 'sub1_amount'],
    },
    {
      key: 'subscription_2',
      display: 'section',
      label: 'Subscription 2',
      icon: 'calendar',
      props: ['sub2_productCode', 'sub2_paymentPeriodType', 'sub2_systemType', 'sub2_code', 'sub2_name', 'sub2_level', 'sub2_startDate', 'sub2_endDate', 'sub2_amount'],
    },
    {
      key: 'subscription_3',
      display: 'section',
      label: 'Subscription 3',
      icon: 'calendar',
      props: ['sub3_productCode', 'sub3_paymentPeriodType', 'sub3_systemType', 'sub3_code', 'sub3_name', 'sub3_level', 'sub3_startDate', 'sub3_endDate', 'sub3_amount'],
    },
  ],
  async run(context) {
    const customer = {
      star: context.propsValue.star,
      importType: context.propsValue.importType,
      ignoreInvalidValues: context.propsValue.ignoreInvalidValues,
      matchExisting: context.propsValue.matchExisting,
      overrideLists: context.propsValue.overrideLists,
      createUser: context.propsValue.createUser,
      sendWelcomeEmail: context.propsValue.sendWelcomeEmail,
      contactId: chargekeepClient.positiveId({ value: context.propsValue.contactId, label: 'Contact ID' }),
      contactXref: context.propsValue.contactXref,
      userPassword: context.propsValue.userPassword,
      personalInfo: {
        fullName: {
          namePrefix: context.propsValue.namePrefix,
          firstName: context.propsValue.firstName,
          middleName: context.propsValue.middleName,
          lastName: context.propsValue.lastName,
          nameSuffix: context.propsValue.nameSuffix,
          nickName: context.propsValue.nickName,
        },
        doB: context.propsValue.dob,
        mobilePhone: context.propsValue.mobilePhone,
        mobilePhoneExt: context.propsValue.mobilePhoneExt,
        homePhone: context.propsValue.homePhone,
        homePhoneExt: context.propsValue.homePhoneExt,
        ssn: context.propsValue.ssn,
        bankCode: context.propsValue.bankCode,
        email1: context.propsValue.email1,
        email2: context.propsValue.email2,
        email3: context.propsValue.email3,
        preferredToD: context.propsValue.preferredToD,
        drivingLicense: context.propsValue.drivingLicense,
        drivingLicenseState: context.propsValue.drivingLicenseState,
        isActiveMilitaryDuty: context.propsValue.isActiveMilitaryDuty,
        gender: context.propsValue.gender,
        fullAddress: {
          street: context.propsValue.home_street,
          addressLine2: context.propsValue.home_addressLine2,
          city: context.propsValue.home_city,
          stateName: context.propsValue.home_stateName,
          stateId: context.propsValue.home_stateId,
          zip: context.propsValue.home_zip,
          countryName: context.propsValue.home_countryName,
          countryId: context.propsValue.home_countryId,
        },
        isUSCitizen: context.propsValue.isUSCitizen,
        webSiteUrl: context.propsValue.webSiteUrl,
        facebookUrl: context.propsValue.facebookUrl,
        linkedInUrl: context.propsValue.linkedInUrl,
        instagramUrl: context.propsValue.instagramUrl,
        twitterUrl: context.propsValue.twitterUrl,
        googlePlusUrl: context.propsValue.googlePlusUrl,
        angelListUrl: context.propsValue.angelListUrl,
        zoomUrl: context.propsValue.zoomUrl,
        photoUrl: context.propsValue.photoUrl,
        experience: context.propsValue.experience,
        profileSummary: context.propsValue.profileSummary,
        affiliateCode: context.propsValue.personAffiliateCode,
        customFields: {
          customField1: context.propsValue.customField1,
          customField2: context.propsValue.customField2,
          customField3: context.propsValue.customField3,
          customField4: context.propsValue.customField4,
          customField5: context.propsValue.customField5,
        },
      },
      businessInfo: {
        companyName: context.propsValue.companyName,
        organizationType: context.propsValue.organizationType,
        jobTitle: context.propsValue.jobTitle,
        isEmployed: context.propsValue.isEmployed,
        employmentStartDate: context.propsValue.employmentStartDate,
        employeeCount: context.propsValue.employeeCount,
        dateFounded: context.propsValue.dateFounded,
        ein: context.propsValue.ein,
        annualRevenue: context.propsValue.annualRevenue,
        industry: context.propsValue.industry,
        companyPhone: context.propsValue.companyPhone,
        companyPhoneExt: context.propsValue.companyPhoneExt,
        companyFaxNumber: context.propsValue.companyFaxNumber,
        companyEmail: context.propsValue.companyEmail,
        companyFullAddress: {
          street: context.propsValue.company_street,
          addressLine2: context.propsValue.company_addressLine2,
          city: context.propsValue.company_city,
          stateName: context.propsValue.company_stateName,
          stateId: context.propsValue.company_stateId,
          zip: context.propsValue.company_zip,
          countryName: context.propsValue.company_countryName,
          countryId: context.propsValue.company_countryId,
        },
        companyWebSiteUrl: context.propsValue.companyWebSiteUrl,
        companyFacebookUrl: context.propsValue.companyFacebookUrl,
        companyLinkedInUrl: context.propsValue.companyLinkedInUrl,
        companyInstagramUrl: context.propsValue.companyInstagramUrl,
        companyTwitterUrl: context.propsValue.companyTwitterUrl,
        companyGooglePlusUrl: context.propsValue.companyGooglePlusUrl,
        companyCrunchbaseUrl: context.propsValue.companyCrunchbaseUrl,
        companyBBBUrl: context.propsValue.companyBBBUrl,
        companyCalendlyUrl: context.propsValue.companyCalendlyUrl,
        companyZoomUrl: context.propsValue.companyZoomUrl,
        companyLogoUrl: context.propsValue.companyLogoUrl,
        workPhone1: context.propsValue.workPhone1,
        workPhone1Ext: context.propsValue.workPhone1Ext,
        workPhone2: context.propsValue.workPhone2,
        workPhone2Ext: context.propsValue.workPhone2Ext,
        workEmail1: context.propsValue.workEmail1,
        workEmail2: context.propsValue.workEmail2,
        workEmail3: context.propsValue.workEmail3,
        workFullAddress: {
          street: context.propsValue.work_street,
          addressLine2: context.propsValue.work_addressLine2,
          city: context.propsValue.work_city,
          stateName: context.propsValue.work_stateName,
          stateId: context.propsValue.work_stateId,
          zip: context.propsValue.work_zip,
          countryName: context.propsValue.work_countryName,
          countryId: context.propsValue.work_countryId,
        },
        affiliateCode: context.propsValue.companyAffiliateCode,
      },
      assignedUser: context.propsValue.assignedUser,
      followUpDate: context.propsValue.followUpDate,
      notes: context.propsValue.notes,
      dateCreated: context.propsValue.dateCreated,
      leadStageName: context.propsValue.leadStageName,
      leadSource: context.propsValue.leadSource,
      leadDealAmount: context.propsValue.leadDealAmount,
      affiliateCode: context.propsValue.affiliateCode,
      campaignId: context.propsValue.campaignId,
      channelId: context.propsValue.channelId,
      gclId: context.propsValue.gclId,
      refererUrl: context.propsValue.refererURL,
      entryUrl: context.propsValue.entryUrl,
      applicantId: context.propsValue.applicantId,
      applicationId: context.propsValue.applicationId,
      ipAddress: context.propsValue.ipAddress,
      userAgent: context.propsValue.userAgent,
      siteId: context.propsValue.siteId,
      siteUrl: context.propsValue.siteUrl,
      utmSource: context.propsValue.utmSource,
      utmMedium: context.propsValue.utmMedium,
      utmCampaign: context.propsValue.utmCampaign,
      utmTerm: context.propsValue.utmTerm,
      utmContent: context.propsValue.utmContent,
      utmKeyword: context.propsValue.utmKeyword,
      utmAdGroup: context.propsValue.utmAdGroup,
      utmName: context.propsValue.utmName,
      requestCustomInfo: {
        customField1: context.propsValue.requestCustomField1,
        customField2: context.propsValue.requestCustomField2,
        customField3: context.propsValue.requestCustomField3,
        customField4: context.propsValue.requestCustomField4,
        customField5: context.propsValue.requestCustomField5,
      },
      subscription1: {
        productCode: context.propsValue.sub1_productCode,
        paymentPeriodType: context.propsValue.sub1_paymentPeriodType,
        systemType: context.propsValue.sub1_systemType,
        code: context.propsValue.sub1_code,
        name: context.propsValue.sub1_name,
        level: context.propsValue.sub1_level,
        startDate: context.propsValue.sub1_startDate,
        endDate: context.propsValue.sub1_endDate,
        amount: context.propsValue.sub1_amount,
      },
      subscription2: {
        productCode: context.propsValue.sub2_productCode,
        paymentPeriodType: context.propsValue.sub2_paymentPeriodType,
        systemType: context.propsValue.sub2_systemType,
        code: context.propsValue.sub2_code,
        name: context.propsValue.sub2_name,
        level: context.propsValue.sub2_level,
        startDate: context.propsValue.sub2_startDate,
        endDate: context.propsValue.sub2_endDate,
        amount: context.propsValue.sub2_amount,
      },
      subscription3: {
        productCode: context.propsValue.sub3_productCode,
        paymentPeriodType: context.propsValue.sub3_paymentPeriodType,
        systemType: context.propsValue.sub3_systemType,
        code: context.propsValue.sub3_code,
        name: context.propsValue.sub3_name,
        level: context.propsValue.sub3_level,
        startDate: context.propsValue.sub3_startDate,
        endDate: context.propsValue.sub3_endDate,
        amount: context.propsValue.sub3_amount,
      },
      classificationInfo: {
        rating: context.propsValue.rating,
      },
    };

    contactCommon.assertIdentity({
      firstName: context.propsValue.firstName,
      lastName: context.propsValue.lastName,
      companyName: context.propsValue.companyName,
      emails: [context.propsValue.email1, context.propsValue.email2, context.propsValue.email3, context.propsValue.workEmail1, context.propsValue.workEmail2, context.propsValue.workEmail3],
      contactId: customer.contactId,
      contactXref: context.propsValue.contactXref,
    });

    const { mapped } = await chargekeepServices.importContact({ auth: context.auth, body: customer });
    return mapped();
  },
});
