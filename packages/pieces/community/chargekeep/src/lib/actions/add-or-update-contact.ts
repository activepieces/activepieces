import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../auth';
import { chargekeepClient } from '../common/client';
import { chargekeepServices } from '../common/services';
import { contactCommon } from '../common/contact';
import { chargekeepOutputSchemas } from '../common/output-schemas';

export const addOrUpdateContact = createAction({
  name: 'addOrUpdateContact',
  classification: 'WRITE',
  displayName: 'Add or Update Contact',
  description: 'Creates a contact, or updates it when it matches an existing one.',
  audience: 'human',
  aiMetadata: { description: 'Imports a contact (Lead, Client, or Partner) into the ChargeKeep/Sperse CRM, creating it or updating an existing record. When Match Existing is enabled it upserts by matching on email and full name (or the supplied Contact ID); otherwise it always creates a new record. Use to add or sync a person; requires at least one of First Name, Last Name, Company Name or an email. Repeating with the same identifying input upserts the same contact rather than duplicating.', idempotent: true },
  auth: chargekeepAuth,
  outputSchema: chargekeepOutputSchemas.importedContact,
  propertyGroups: [
    {
      key: 'record',
      display: 'section',
      label: 'Contact',
      icon: 'user',
      props: ['importType', 'identity_info', 'matchExisting', 'contactId'],
    },
    {
      key: 'name',
      display: 'section',
      label: 'Name',
      icon: 'type',
      props: ['fullName', 'namePrefix', 'nameSuffix', 'firstName', 'lastName', 'middleName', 'nickName'],
    },
    {
      key: 'personal',
      display: 'section',
      label: 'Personal Details',
      icon: 'user',
      props: ['gender', 'dob', 'ssn', 'bankCode'],
    },
    {
      key: 'work',
      display: 'section',
      label: 'Work',
      icon: 'users',
      props: ['companyName', 'jobTitle', 'industry'],
    },
    {
      key: 'reach',
      display: 'section',
      label: 'Email, Phone and Links',
      icon: 'send',
      props: ['email1', 'email2', 'workEmail1', 'mobilePhone', 'homePhone', 'workPhone1', 'webSiteUrl', 'linkedInUrl', 'photoUrl'],
    },
    {
      key: 'address',
      display: 'section',
      label: 'Address',
      icon: 'location',
      props: ['street', 'addressLine2', 'city', 'zip', 'stateName', 'stateId', 'countryName', 'countryId'],
    },
    {
      key: 'profile',
      display: 'section',
      label: 'Profile',
      icon: 'text',
      props: ['experience', 'profileSummary', 'notes'],
    },
    {
      key: 'follow_up',
      display: 'section',
      label: 'Follow-Up',
      icon: 'calendar',
      props: ['followUpDate', 'assignedUser', 'leadDealAmount'],
    },
    {
      key: 'marketing',
      display: 'section',
      label: 'Marketing',
      icon: 'tag',
      props: ['leadSource', 'channelId', 'affiliateCode', 'refererURL', 'entryUrl'],
    },
  ],
  props: {
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
    identity_info: Property.MarkDown({
      value: 'Give at least a name, a company or an email, or a Contact ID. Empty fields are not sent, so an update keeps what ChargeKeep already has.',
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
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'ChargeKeep ID of the contact to update. Empty: match or create.',
      required: false,
    }),
    fullName: Property.ShortText({
      displayName: 'Full Name',
      description: 'Fills First and Last Name when both are empty.',
      required: false,
    }),
    namePrefix: Property.ShortText({
      displayName: 'Prefix',
      placeholder: 'Dr.',
      required: false,
      width: 'half',
    }),
    nameSuffix: Property.ShortText({
      displayName: 'Suffix',
      placeholder: 'PhD',
      required: false,
      width: 'half',
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
      width: 'half',
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
      width: 'half',
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      required: false,
      width: 'half',
    }),
    nickName: Property.ShortText({
      displayName: 'Nickname',
      required: false,
      width: 'half',
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      required: false,
      width: 'half',
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
      required: false,
      width: 'half',
    }),
    ssn: Property.ShortText({
      displayName: 'SSN',
      description: "The contact's social security number.",
      required: false,
      width: 'half',
    }),
    bankCode: Property.ShortText({
      displayName: 'Bank Code',
      description: "The contact's 4-letter personality code.",
      required: false,
      width: 'half',
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      required: false,
      width: 'half',
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      required: false,
      width: 'half',
    }),
    email1: Property.LongText({
      displayName: 'Personal Email',
      required: false,
    }),
    email2: Property.LongText({
      displayName: 'Alternative Personal Email',
      required: false,
    }),
    workEmail1: Property.LongText({
      displayName: 'Work Email',
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      required: false,
      width: 'half',
    }),
    homePhone: Property.ShortText({
      displayName: 'Home Phone',
      required: false,
      width: 'half',
    }),
    workPhone1: Property.ShortText({
      displayName: 'Work Phone',
      required: false,
    }),
    webSiteUrl: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    linkedInUrl: Property.ShortText({
      displayName: 'LinkedIn',
      description: "Link to the contact's LinkedIn profile.",
      required: false,
    }),
    photoUrl: Property.ShortText({
      displayName: 'Photo URL',
      required: false,
    }),
    street: Property.ShortText({
      displayName: 'Street',
      description: 'Can include an apartment or unit number.',
      required: false,
    }),
    addressLine2: Property.ShortText({
      displayName: 'Address Line 2',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
      width: 'half',
    }),
    zip: Property.ShortText({
      displayName: 'ZIP Code',
      required: false,
      width: 'half',
    }),
    stateName: Property.ShortText({
      displayName: 'State Name',
      required: false,
      width: 'half',
    }),
    stateId: Property.ShortText({
      displayName: 'State Code',
      description: 'Two-letter state code.',
      placeholder: 'CA',
      required: false,
      width: 'half',
    }),
    countryName: Property.ShortText({
      displayName: 'Country Name',
      required: false,
      width: 'half',
    }),
    countryId: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter country code.',
      placeholder: 'US',
      required: false,
      width: 'half',
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
      required: false,
    }),
    leadSource: Property.ShortText({
      displayName: 'Source Code',
      description: 'Where the contact first found you, such as google or newsletter.',
      required: false,
      width: 'half',
    }),
    channelId: Property.ShortText({
      displayName: 'Channel Code',
      description: 'How the contact reached you, such as email or paid search.',
      required: false,
      width: 'half',
    }),
    affiliateCode: Property.ShortText({
      displayName: 'Affiliate Code',
      description: 'Code of the affiliate partner who referred the contact.',
      required: false,
    }),
    refererURL: Property.ShortText({
      displayName: 'Referrer URL',
      description: 'The page whose link brought the contact to your website.',
      required: false,
    }),
    entryUrl: Property.ShortText({
      displayName: 'Entry URL',
      description: 'The first page the contact visited on your website.',
      required: false,
    }),
  },
  async run(context) {
    const split = contactCommon.splitFullName({ fullName: context.propsValue.fullName, firstName: context.propsValue.firstName, lastName: context.propsValue.lastName });
    const contactId = chargekeepClient.positiveId({ value: context.propsValue.contactId, label: 'Contact ID' });
    contactCommon.assertIdentity({
      firstName: split.firstName,
      lastName: split.lastName,
      companyName: context.propsValue.companyName,
      emails: [context.propsValue.email1, context.propsValue.email2, context.propsValue.workEmail1],
      contactId,
    });
    const contact = {
      importType: context.propsValue.importType,
      matchExisting: context.propsValue.matchExisting,
      contactId,
      personalInfo: {
        fullName: {
          namePrefix: context.propsValue.namePrefix,
          firstName: split.firstName,
          middleName: context.propsValue.middleName,
          lastName: split.lastName,
          nameSuffix: context.propsValue.nameSuffix,
          nickName: context.propsValue.nickName,
        },
        doB: context.propsValue.dob,
        mobilePhone: context.propsValue.mobilePhone,
        homePhone: context.propsValue.homePhone,
        ssn: context.propsValue.ssn,
        bankCode: context.propsValue.bankCode,
        email1: context.propsValue.email1,
        email2: context.propsValue.email2,
        gender: context.propsValue.gender,
        fullAddress: {
          street: context.propsValue.street,
          addressLine2: context.propsValue.addressLine2,
          city: context.propsValue.city,
          stateName: context.propsValue.stateName,
          stateId: context.propsValue.stateId,
          zip: context.propsValue.zip,
          countryName: context.propsValue.countryName,
          countryId: context.propsValue.countryId,
        },
        webSiteUrl: context.propsValue.webSiteUrl,
        linkedInUrl: context.propsValue.linkedInUrl,
        photoUrl: context.propsValue.photoUrl,

        experience: context.propsValue.experience,
        profileSummary: context.propsValue.profileSummary,
      },

      businessInfo: {
        companyName: context.propsValue.companyName,
        jobTitle: context.propsValue.jobTitle,
        industry: context.propsValue.industry,
        workPhone1: context.propsValue.workPhone1,
        workEmail1: context.propsValue.workEmail1,
      },

      assignedUser: context.propsValue.assignedUser,
      followUpDate: context.propsValue.followUpDate,
      notes: context.propsValue.notes,
      leadDealAmount: context.propsValue.leadDealAmount,

      leadSource: context.propsValue.leadSource,
      channelId: context.propsValue.channelId,
      affiliateCode: context.propsValue.affiliateCode,
      refererUrl: context.propsValue.refererURL,
      entryUrl: context.propsValue.entryUrl,
    };

    const { mapped } = await chargekeepServices.importContact({ auth: context.auth, body: contact });
    return mapped();
  },
});
