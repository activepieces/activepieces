import { createAction } from '@activepieces/pieces-framework';
import { Contact, EmailAddress } from '@microsoft/microsoft-graph-types';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

export const createContact = createAction({
  auth: microsoft365PeopleAuth,
  name: 'createContact',
  displayName: 'Create a Contact',
  description:'Create a new contact in People with detailed attributes (email, phone, address, etc.).',
  props: microsoft365PeopleCommon.contactProperties(),
  async run({ auth, propsValue }) {
    const childrenNames: string[] =
      (propsValue.children as Array<{ name: string }> | undefined)?.map(
        (child) => child.name
      ) ?? [];
    const emailAddresses: EmailAddress[] =
      (propsValue.emailAddresses as Array<EmailAddress> | undefined) ?? [];
    const imAddresses: string[] =
      (propsValue.imAddresses as Array<{ address: string }> | undefined)?.map(
        (im) => im.address
      ) ?? [];

    const contact: Contact = {
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
    };

    return await microsoft365PeopleCommon.createContact({
      auth,
      contact,
    });
  },
});
