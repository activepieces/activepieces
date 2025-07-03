import { createAction, Property } from '@activepieces/pieces-framework';
import { linkaAuth } from '../../';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const addOrUpdateContactExtended = createAction({
  name: 'addOrUpdateContactExtended',
  displayName: 'Add or Update Contact (Extended)',
  description: 'Adds or updates a contact (extended version)',
  auth: linkaAuth,
  props: {
    matchExisting: Property.StaticDropdown({
      displayName: 'Match Existing Contact',
      description:
        'If "Yes", will try to find an existing record using Email and Full Name and update it.',
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
      displayName: 'Override Lists',
      description:
        'If "Yes", will override lists of contact details in update mode instead of merging them - lists, tags, emails, phones, links, addresses, photos.',
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
      description:
        'If "Yes", will save the record even if there are some validation errors.',
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
      description: 'Sperse Contact ID. Will be used for looking a client',
      defaultValue: 0,
      required: false,
    }),
    contactXref: Property.ShortText({
      displayName: 'Contact XREF',
      description:
        'This is string external reference that can be passed during creation and then if sent again it will update the record.',
      required: false,
    }),
    importType: Property.StaticDropdown({
      displayName: 'Contact Type',
      required: true,
      defaultValue: 'Lead',
      options: {
        disabled: false,
        options: [
          {
            label: 'Lead',
            value: 'Lead',
          },
          {
            label: 'Client',
            value: 'Client',
          },
          {
            label: 'Partner',
            value: 'Partner',
          },
        ],
      },
    }),
    // user info
    createUser: Property.StaticDropdown({
      displayName: 'Create User',
      description:
        'If "Yes" then User will be created. Personal email will be used as User Name.',
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
    sendWelcomeEmail: Property.StaticDropdown({
      displayName: 'Send Welcome Email',
      description:
        'If "Yes" then Welcome Email will be sent to the newly created user.',
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
    userPassword: Property.ShortText({
      displayName: 'User Password',
      description:
        'If password is not passed then it will be automatically generated.',
      required: false,
    }),
    // fullname
    namePrefix: Property.ShortText({
      displayName: 'Prefix',
      description: 'The title used to address the contact.',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Required if Last Name and Company Name fields are empty.',
      required: true,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      description: "The contact's middle name.",
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Required if First Name and Company Name fields are empty.',
      required: true,
    }),
    nickName: Property.ShortText({
      displayName: 'Nick Name',
      description: "The contact's nick name.",
      required: false,
    }),
    nameSuffix: Property.ShortText({
      displayName: 'Suffix',
      description: 'Additional information about the contact e.g PhD.',
      required: false,
    }),
    // personal info
    gender: Property.StaticDropdown({
      displayName: 'Gender',
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
      description: 'Valid date format YYYY-MM-DD or MM-DD-YYYY.',
      required: false,
    }),
    bankCode: Property.ShortText({
      displayName: 'Bank Code',
      description: "The contact's 4-letter personality code.",
      required: false,
    }),
    ssn: Property.ShortText({
      displayName: 'SSN',
      description: "The contact's social security number.",
      required: false,
    }),
    drivingLicense: Property.ShortText({
      displayName: 'Driving License',
      required: false,
    }),
    drivingLicenseState: Property.ShortText({
      displayName: 'Driving License State',
      required: false,
    }),
    isActiveMilitaryDuty: Property.StaticDropdown({
      displayName: 'Is Active Military Duty',
      description:
        'Possible values are: Yes, No. If nothing is chosen that means "Unknown".',
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
      displayName: 'Is US Citizen',
      description:
        'Possible values are: Yes, No. If nothing is chosen that means "Unknown".',
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
      description: 'Preferred Time of Day to contact with Client',
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
      displayName: 'Person Affiliate Code',
      description:
        'Affiliate Code is used for the current person detection as a source of new leads. Alphanumeric characters, underscore and hyphen are allowed.',
      required: false,
    }),
    // email
    email1: Property.LongText({
      displayName: 'Personal Email',
      description: "The contact's personal email.",
      required: false,
    }),
    email2: Property.LongText({
      displayName: 'Alternative Personal email',
      description: "The contact's alternative personal email.",
      required: false,
    }),
    email3: Property.LongText({
      displayName: 'Other Personal email',
      description: "The contact's additional email.",
      required: false,
    }),
    workEmail1: Property.LongText({
      displayName: 'Work Email',
      description: "The contact's work email.",
      required: false,
    }),
    workEmail2: Property.LongText({
      displayName: 'Alternative Work Email',
      description: "The contact's alternative work email.",
      required: false,
    }),
    workEmail3: Property.LongText({
      displayName: 'Other Work Email',
      description: "The contact's other work email.",
      required: false,
    }),
    // phone
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      description: "The contact's primary phone number.",
      required: false,
    }),
    mobilePhoneExt: Property.ShortText({
      displayName: 'Mobile Phone Ext',
      description: "The contact's primary phone number extension.",
      required: false,
    }),
    homePhone: Property.ShortText({
      displayName: 'Home Phone',
      description: "The contact's home phone number.",
      required: false,
    }),
    homePhoneExt: Property.ShortText({
      displayName: 'Home Phone Ext',
      description: "The contact's home phone number extension.",
      required: false,
    }),
    workPhone1: Property.ShortText({
      displayName: 'Work Phone',
      description: "The contact's work phone number.",
      required: false,
    }),
    workPhone1Ext: Property.ShortText({
      displayName: 'Work Phone Ext',
      description: "The contact's work phone number extension.",
      required: false,
    }),
    workPhone2: Property.ShortText({
      displayName: 'Work Phone 2',
      description: "The contact's alternative work phone number.",
      required: false,
    }),
    workPhone2Ext: Property.ShortText({
      displayName: 'Work Phone 2 Ext',
      description: "The contact's alternative work phone number extension.",
      required: false,
    }),
    // home address
    home_street: Property.LongText({
      displayName: 'Home Street',
      description:
        "The contact's full street address (can include apartment or unit number).",
      required: false,
    }),
    home_addressLine2: Property.LongText({
      displayName: 'Address 2',
      required: false,
    }),
    home_city: Property.LongText({
      displayName: 'City',
      description: "The contact's city of residence.",
      required: false,
    }),
    home_stateName: Property.ShortText({
      displayName: 'State Name',
      description: "The contact's state of residence.",
      required: false,
    }),
    home_stateId: Property.ShortText({
      displayName: 'State Code',
      description: "The contact's state code.",
      required: false,
    }),
    home_zip: Property.ShortText({
      displayName: 'ZIP Code',
      description: "The contact's zip/postal code.",
      required: false,
    }),
    home_countryName: Property.ShortText({
      displayName: 'Country Name',
      description: "The contact's country of residence.",
      required: false,
    }),
    home_countryId: Property.ShortText({
      displayName: 'Country Code',
      description: "The contact's country code.",
      required: false,
    }),
    // work address
    work_street: Property.LongText({
      displayName: 'Work Street',
      description: "The contact's work address.",
      required: false,
    }),
    work_addressLine2: Property.LongText({
      displayName: 'Address 2',
      required: false,
    }),
    work_city: Property.LongText({
      displayName: 'City',
      description: "The contact's work city.",
      required: false,
    }),
    work_stateName: Property.ShortText({
      displayName: 'State Name',
      description: "The contact's work state.",
      required: false,
    }),
    work_stateId: Property.ShortText({
      displayName: 'State Code',
      description: "The contact's work state code.",
      required: false,
    }),
    work_zip: Property.ShortText({
      displayName: 'ZIP Code',
      description: "The contact's work zip code.",
      required: false,
    }),
    work_countryName: Property.ShortText({
      displayName: 'Country Name',
      description: "The contact's work country.",
      required: false,
    }),
    work_countryId: Property.ShortText({
      displayName: 'Country Code',
      description: "The contact's work country code.",
      required: false,
    }),
    // links
    webSiteUrl: Property.LongText({
      displayName: 'Website',
      description: "The contact's company website URL.",
      required: false,
    }),
    linkedInUrl: Property.LongText({
      displayName: 'LinkedIn',
      description: "The contact's LinkedIn profile id.",
      required: false,
    }),
    photoUrl: Property.LongText({
      displayName: 'Photo URL',
      description: "The contact's person photo URL.",
      required: false,
    }),
    facebookUrl: Property.LongText({
      displayName: 'Facebook',
      description: "The contact's Facebook profile id.",
      required: false,
    }),
    instagramUrl: Property.LongText({
      displayName: 'Instagram',
      description: "The contact's Instagram profile id.",
      required: false,
    }),
    twitterUrl: Property.LongText({
      displayName: 'Twitter',
      description: "The contact's Twitter profile id.",
      required: false,
    }),
    googlePlusUrl: Property.LongText({
      displayName: 'Google Reviews',
      description: "The contact's Google reviews.",
      required: false,
    }),
    angelListUrl: Property.LongText({
      displayName: 'AngelList',
      description: "The contact's AngelList profile id.",
      required: false,
    }),
    zoomUrl: Property.LongText({
      displayName: 'Zoom',
      description: "The contact's Zoom id.",
      required: false,
    }),
    // content
    experience: Property.LongText({
      displayName: 'Content',
      description: "The contact's professional experience.",
      required: false,
    }),
    profileSummary: Property.LongText({
      displayName: 'Profile Summary',
      description: "The contact's profile summary.",
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the contact',
      required: false,
    }),
    followUpDate: Property.ShortText({
      displayName: 'Follow Up Date',
      description:
        'Valid date format YYYY-MM-DD HH:MM:SS. If date is defined then new Follow Up Task will be created for this contact',
      required: false,
    }),
    assignedUser: Property.ShortText({
      displayName: 'Assigned User',
      description:
        'Preferably, Sperse User Email should be passed as it is unique within Sperse account but User Name can be also passed',
      required: false,
    }),
    leadDealAmount: Property.Number({
      displayName: 'Deal Amount',
      description: 'Estimated deal/opportunity amount.',
      required: false,
    }),
    // custom fields
    customField1: Property.LongText({
      displayName: 'Custom Field 1',
      description: 'Additional custom data for the contact record.',
      required: false,
    }),
    customField2: Property.LongText({
      displayName: 'Custom Field 2',
      required: false,
    }),
    customField3: Property.LongText({
      displayName: 'Custom Field 3',
      required: false,
    }),
    customField4: Property.LongText({
      displayName: 'Custom Field 4',
      required: false,
    }),
    customField5: Property.LongText({
      displayName: 'Custom Field 5',
      required: false,
    }),
    // business info
    companyName: Property.LongText({
      displayName: 'Company Name',
      description:
        "Name of the contact's company (This field is mandatory if the First Name and Last Name fields are empty).",
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
            label: 'Sole Proprietership',
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
      displayName: 'Is Employed',
      description: 'Pass yes if the client is employed in this Organization.',
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
      description: "The contact's job title.",
      required: false,
    }),
    employmentStartDate: Property.ShortText({
      displayName: 'Employment Start Date',
      description: 'Valid date format YYYY-MM-DD or MM-DD-YYYY',
      required: false,
    }),
    employeeCount: Property.ShortText({
      displayName: 'Employee Count',
      required: false,
    }),
    dateFounded: Property.ShortText({
      displayName: 'Date Founded',
      description: 'Valid date format YYYY-MM-DD or MM-DD-YYYY',
      required: false,
    }),
    ein: Property.LongText({
      displayName: 'EIN',
      required: false,
    }),
    annualRevenue: Property.Number({
      displayName: 'Annual Revenue',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: "The company's industry.",
      required: false,
    }),
    companyPhone: Property.ShortText({
      displayName: 'Company Phone',
      required: false,
    }),
    companyPhoneExt: Property.ShortText({
      displayName: 'Company Phone Extension',
      required: false,
    }),
    companyFaxNumber: Property.LongText({
      displayName: 'Company Fax Number',
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
    // company full Address
    company_street: Property.LongText({
      displayName: 'Company Street',
      required: false,
    }),
    company_addressLine2: Property.LongText({
      displayName: 'Address 2',
      required: false,
    }),
    company_city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    company_stateName: Property.ShortText({
      displayName: 'State Name',
      required: false,
    }),
    company_stateId: Property.ShortText({
      displayName: 'State Code',
      required: false,
    }),
    company_zip: Property.ShortText({
      displayName: 'Company Zip Code',
      required: false,
    }),
    company_countryName: Property.LongText({
      displayName: 'Company Country Name',
      required: false,
    }),
    company_countryId: Property.ShortText({
      displayName: 'Company Country Code',
      required: false,
    }),
    // tracking info
    leadSource: Property.ShortText({
      displayName: 'Source Code',
      description:
        'The first known source the contact used to find your website. You can set this automatically and update manually later.',
      required: false,
    }),
    channelId: Property.ShortText({
      displayName: 'Channel Code',
      description: 'The channel/medium the contact used to find your website.',
      required: false,
    }),
    affiliateCode: Property.ShortText({
      displayName: 'Affiliate Code',
      description:
        'The affiliate/referer partner through which the contact signed up.',
      required: false,
    }),
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      required: false,
    }),
    gclId: Property.ShortText({
      displayName: 'Google Click ID',
      required: false,
    }),
    refererURL: Property.LongText({
      displayName: 'Referer URL',
      description:
        'The webpage where the contact clicked a link that sent them to your website.',
      required: false,
    }),
    applicantId: Property.ShortText({
      displayName: 'Applicant ID',
      required: false,
    }),
    applicationId: Property.ShortText({
      displayName: 'Application ID',
      required: false,
    }),
    ipAddress: Property.LongText({
      displayName: 'IP Address',
      required: false,
    }),
    userAgent: Property.ShortText({
      displayName: 'User Agent',
      required: false,
    }),
    siteId: Property.ShortText({
      displayName: 'Site ID',
      required: false,
    }),
    siteUrl: Property.LongText({
      displayName: 'Site URL',
      required: false,
    }),
    dateCreated: Property.ShortText({
      displayName: 'Date Created',
      description: 'Valid date format YYYY-MM-DD HH:MM:SS',
      required: false,
    }),
    entryUrl: Property.LongText({
      displayName: 'Entry URL',
      description:
        'The first page of visit through which the contact visited your website.',
      required: false,
    }),
    // contact Attributes
    leadStageName: Property.ShortText({
      displayName: 'Lead Stage Name',
      description:
        'The first page of visit through which the contact visited your website.',
      required: false,
    }),
    star: Property.ShortText({
      displayName: 'Star',
      description:
        'String Value. Supports the following items: Yellow, Blue, Green, Purple, Red. Other values will be skipped.',
      required: false,
    }),
    rating: Property.ShortText({
      displayName: 'Rating',
      description: 'This is the static array from 1 to 10',
      required: false,
    }),
    // UtmParameters
    utmSource: Property.LongText({
      displayName: 'UTM Source',
      required: false,
    }),
    utmMedium: Property.LongText({
      displayName: 'UTM Medium',
      required: false,
    }),
    utmCampaign: Property.LongText({
      displayName: 'UTM Campaign',
      required: false,
    }),
    utmTerm: Property.LongText({
      displayName: 'UTM Term',
      required: false,
    }),
    utmContent: Property.LongText({
      displayName: 'UTM Content',
      required: false,
    }),
    utmKeyword: Property.LongText({
      displayName: 'UTM Keyword',
      required: false,
    }),
    utmAdGroup: Property.LongText({
      displayName: 'UTM AdGroup',
      required: false,
    }),
    utmName: Property.LongText({
      displayName: 'UTM Name',
      required: false,
    }),
    // requestCustomInfo
    requestCustomField1: Property.LongText({
      displayName: 'Request Custom Field 1',
      required: false,
    }),
    requestCustomField2: Property.LongText({
      displayName: 'Request Custom Field 2',
      required: false,
    }),
    requestCustomField3: Property.LongText({
      displayName: 'Request Custom Field 3',
      required: false,
    }),
    requestCustomField4: Property.LongText({
      displayName: 'Request Custom Field 4',
      required: false,
    }),
    requestCustomField5: Property.LongText({
      displayName: 'Request Custom Field 5',
      required: false,
    }),
    // subscription1
    sub1_productCode: Property.ShortText({
      displayName: 'Product Code',
      description:
        'Product Code from the Sperse CRM. Either Product Code and Payment Period Type or System Type and Code are required fields within Subscription 1.',
      required: false,
    }),
    sub1_paymentPeriodType: Property.StaticDropdown({
      displayName: 'Product Payment Period Type',
      description:
        'The chosen Period Type has to be set for the Product on Sperse side',
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
            label: 'LifeTime',
            value: 'LifeTime',
          },
        ],
      },
    }),
    sub1_systemType: Property.ShortText({
      displayName: 'System Type',
      description:
        'Either Product Code and Payment Period Type or System Type and Code are required fields within Subscription 1.',
      required: false,
    }),
    sub1_code: Property.ShortText({
      displayName: 'Code',
      description:
        'Code of subscription service from the Sperse CRM. Either Product Code and Payment Period Type or System Type and Code are required fields within Subscription 1.',
      required: false,
    }),
    sub1_name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    sub1_level: Property.ShortText({
      displayName: 'Level',
      description: 'Code of subscription service level from the Sperse CRM.',
      required: false,
    }),
    sub1_startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Valid date format YYYY-MM-DD HH:MM:SS.',
      required: false,
    }),
    sub1_endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Valid date format YYYY-MM-DD HH:MM:SS.',
      required: false,
    }),
    sub1_amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    // subscription2
    sub2_productCode: Property.ShortText({
      displayName: 'Product Code',
      description:
        'Product Code from the Sperse CRM. Either Product Code and Payment Period Type or System Type and Code are required fields within Subscription 2.',
      required: false,
    }),
    sub2_paymentPeriodType: Property.StaticDropdown({
      displayName: 'Product Payment Period Type',
      description:
        'The chosen Period Type has to be set for the Product on Sperse side',
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
            label: 'LifeTime',
            value: 'LifeTime',
          },
        ],
      },
    }),
    sub2_systemType: Property.ShortText({
      displayName: 'System Type',
      description:
        'Either Product Code and Payment Period Type or System Type and Code are required fields within Subscription 2.',
      required: false,
    }),
    sub2_code: Property.ShortText({
      displayName: 'Code',
      description:
        'Code of subscription service from the Sperse CRM. Either Product Code and Payment Period Type or System Type and Code are required fields within Subscription 2.',
      required: false,
    }),
    sub2_name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    sub2_level: Property.ShortText({
      displayName: 'Level',
      description: 'Code of subscription service level from the Sperse CRM.',
      required: false,
    }),
    sub2_startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Valid date format YYYY-MM-DD HH:MM:SS.',
      required: false,
    }),
    sub2_endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Valid date format YYYY-MM-DD HH:MM:SS.',
      required: false,
    }),
    sub2_amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    // subscription3
    sub3_productCode: Property.ShortText({
      displayName: 'Product Code',
      description:
        'Product Code from the Sperse CRM. Either Product Code and Payment Period Type or System Type and Code are required fields within Subscription 3.',
      required: false,
    }),
    sub3_paymentPeriodType: Property.StaticDropdown({
      displayName: 'Product Payment Period Type',
      description:
        'The chosen Period Type has to be set for the Product on Sperse side',
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
            label: 'LifeTime',
            value: 'LifeTime',
          },
        ],
      },
    }),
    sub3_systemType: Property.ShortText({
      displayName: 'System Type',
      description:
        'Either Product Code and Payment Period Type or System Type and Code are required fields within Subscription 3.',
      required: false,
    }),
    sub3_code: Property.ShortText({
      displayName: 'Code',
      description:
        'Code of subscription service from the Sperse CRM. Either Product Code and Payment Period Type or System Type and Code are required fields within Subscription 3.',
      required: false,
    }),
    sub3_name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    sub3_level: Property.ShortText({
      displayName: 'Level',
      description: 'Code of subscription service level from the Sperse CRM.',
      required: false,
    }),
    sub3_startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Valid date format YYYY-MM-DD HH:MM:SS.',
      required: false,
    }),
    sub3_endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Valid date format YYYY-MM-DD HH:MM:SS.',
      required: false,
    }),
    sub3_amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
  },
  async run(context) {
    const customer = {
      importType: context.propsValue.importType,
      ignoreInvalidValues: context.propsValue.ignoreInvalidValues,
      matchExisting: context.propsValue.matchExisting,
      overrideLists: context.propsValue.overrideLists,
      createUser: context.propsValue.createUser,
      sendWelcomeEmail: context.propsValue.sendWelcomeEmail,
      contactId: context.propsValue.contactId,
      contactXref: context.propsValue.contactXref,
      userPassword: context.propsValue.userPassword,
      personalInfo: {
        fullName: {
          namePrefix: context.propsValue.namePrefix,
          firstName: context.propsValue.firstName,
          middleName: context.propsValue.middleName,
          lastName: context.propsValue.lastName,
          nameSuffix: context.propsValue.nickName,
          nickName: context.propsValue.nameSuffix,
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
        jobTitle: context.propsValue.isEmployed,
        isEmployed: context.propsValue.jobTitle,
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
        companyCalendlyUrl: context.propsValue.companyZoomUrl,
        companyZoomUrl: context.propsValue.companyCalendlyUrl,
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

    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.auth.base_url}/api/services/CRM/Import/ImportContact`,
      headers: {
        'api-key': context.auth.api_key, // Pass API key in headers
        'Content-Type': 'application/json',
      },
      body: {
        ...customer,
      },
    });

    return {
      status: res.status,
      body: res.body,
    };
  },
});
