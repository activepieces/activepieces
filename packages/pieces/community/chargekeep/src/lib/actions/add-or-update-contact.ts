import { createAction, Property } from '@activepieces/pieces-framework';
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
  props: {
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
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'ChargeKeep contact ID of an existing contact to update. Leave empty to match by email and name, or to create a new contact.',
      required: false,
    }),
    fullName: Property.ShortText({
      displayName: 'Full Name',
      description: "The contact's full name. Used to fill First Name and Last Name when both are empty.",
      required: false,
    }),
    namePrefix: Property.ShortText({
      displayName: 'Prefix',
      description: 'The title used to address the contact.',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Required if Last Name, Company Name and email fields are empty.',
      required: false,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      description: "The contact's middle name.",
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Required if First Name, Company Name and email fields are empty.',
      required: false,
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
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description:
        "Name of the contact's company. Required if First Name, Last Name and email fields are empty.",
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: "The contact's job title.",
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: "The company's industry.",
      required: false,
    }),
    workEmail1: Property.LongText({
      displayName: 'Work Email',
      description: "The contact's work email.",
      required: false,
    }),
    email1: Property.LongText({
      displayName: 'Personal Email',
      description: "The contact's personal email.",
      required: false,
    }),
    email2: Property.LongText({
      displayName: 'Other email',
      description: "The contact's additional email.",
      required: false,
    }),
    workPhone1: Property.ShortText({
      displayName: 'Work Phone',
      description: "The contact's work/primary phone number.",
      required: false,
    }),
    homePhone: Property.ShortText({
      displayName: 'Home Phone',
      description: "The contact's home phone number.",
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      description: "The contact's mobile phone number.",
      required: false,
    }),
    webSiteUrl: Property.ShortText({
      displayName: 'Website',
      description: "The contact's company website URL.",
      required: false,
    }),
    linkedInUrl: Property.ShortText({
      displayName: 'LinkedIn',
      description: "The contact's LinkedIn profile id.",
      required: false,
    }),
    photoUrl: Property.ShortText({
      displayName: 'Photo URL',
      description: "The contact's person photo URL.",
      required: false,
    }),
    street: Property.ShortText({
      displayName: 'Street',
      description:
        "The contact's full street address (can include apartment or unit number).",
      required: false,
    }),
    addressLine2: Property.ShortText({
      displayName: 'Address 2',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: "The contact's city of residence.",
      required: false,
    }),
    stateName: Property.ShortText({
      displayName: 'State Name',
      description: "The contact's state of residence.",
      required: false,
    }),
    stateId: Property.ShortText({
      displayName: 'State Code',
      description: "The contact's state code.",
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Zip Code',
      description: "The contact's zip/postal code.",
      required: false,
    }),
    countryName: Property.ShortText({
      displayName: 'Country Name',
      description: "The contact's country of residence.",
      required: false,
    }),
    countryId: Property.ShortText({
      displayName: 'Country Code',
      description: "The contact's country code.",
      required: false,
    }),
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
      displayName: 'notes',
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
    refererURL: Property.ShortText({
      displayName: 'Referer URL',
      description:
        'The webpage where the contact clicked a link that sent them to your website.',
      required: false,
    }),
    entryUrl: Property.ShortText({
      displayName: 'Entry URL',
      description:
        'The first page of visit through which the contact visited your website.',
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
