import { createAction } from '@activepieces/pieces-framework';
import { Contact, EmailAddress } from '@microsoft/microsoft-graph-types';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

export const updateContact = createAction({
  auth: microsoft365PeopleAuth,
  name: 'updateContact',
  displayName: 'Update a Contact',
  description: 'Modify fields of an existing contact.',
  props: {
    contactId: microsoft365PeopleCommon.contactDropdown(),
    ...microsoft365PeopleCommon.contactProperties(),
  },
  async run({ auth, propsValue }) {
    const contactId = propsValue.contactId;
    if (!contactId || typeof contactId !== 'string') {
      throw new Error('contactId is required.');
    }

    const childrenNames: string[] | undefined = (
      propsValue.children as Array<{ name: string }> | undefined
    )?.map((child) => child.name);
    const emailAddresses: EmailAddress[] | undefined =
      propsValue.emailAddresses as Array<EmailAddress> | undefined;
    const imAddresses: string[] | undefined = (
      propsValue.imAddresses as Array<{ address: string }> | undefined
    )?.map((im) => im.address);
    // Use the JSON methods to create the contact object without any undefined values
    const contact: Contact = JSON.parse(
      JSON.stringify({
        assistantName: propsValue.assistantName,
        birthday: propsValue.birthday,
        businessAddress: {
          street: propsValue.businessStreet,
          city: propsValue.businessCity,
          state: propsValue.businessState,
          postalCode: propsValue.businessPostalCode,
          countryOrRegion: propsValue.businessCountryOrRegion,
        },
        children: childrenNames,
        companyName: propsValue.companyName,
        department: propsValue.department,
        displayName: propsValue.displayName,
        emailAddresses: emailAddresses,
        givenName: propsValue.givenName,
        homeAddress: {
          street: propsValue.homeStreet,
          city: propsValue.homeCity,
          state: propsValue.homeState,
          postalCode: propsValue.homePostalCode,
          countryOrRegion: propsValue.homeCountryOrRegion,
        },
        imAddresses,
        initials: propsValue.initials,
        jobTitle: propsValue.jobTitle,
        manager: propsValue.manager,
        middleName: propsValue.middleName,
        mobilePhone: propsValue.mobilePhone,
        nickName: propsValue.nickName,
        officeLocation: propsValue.officeLocation,
        otherAddress: {
          street: propsValue.otherStreet,
          city: propsValue.otherCity,
          state: propsValue.otherState,
          postalCode: propsValue.otherPostalCode,
          countryOrRegion: propsValue.otherCountryOrRegion,
        },
        parentFolderId: propsValue.parentFolder,
        personalNotes: propsValue.personalNotes,
        profession: propsValue.profession,
        spouseName: propsValue.spouseName,
        surname: propsValue.surname,
        title: propsValue.title,
      })
    );

    return microsoft365PeopleCommon.updateContact({
      auth,
      contactId,
      contact,
    });
  },
});
