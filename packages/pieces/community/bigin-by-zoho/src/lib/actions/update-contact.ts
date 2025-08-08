import { biginAuth } from '../../index';
import {
  createAction,
  Property,
  InputPropertyMap,
  PropertyContext,
} from '@activepieces/pieces-framework';
import { companyDropdown, tagsDropdown, usersDropdown } from '../common/props';
import { biginApiService } from '../common/request';
import { handleDropdownError } from '../common/helpers';

export const updateContact = createAction({
  auth: biginAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Select and update an existing Contact record.',

  props: {
    contactId: Property.Dropdown({
      displayName: 'Select Contact',
      description: 'Choose a contact to update',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }: any) => {
        if (!auth) return handleDropdownError('Please connect first');
        const resp = await biginApiService.fetchContacts(
          auth.access_token,
          auth.api_domain
        );
        return {
          options: resp.data.map((c: any) => ({
            label: `${c.First_Name ?? ''} ${c.Last_Name}`.trim(),
            value: JSON.stringify(c),
          })),
        };
      },
    }),

    contactDetails: Property.DynamicProperties({
      displayName: 'Contact Fields',
      description: 'Edit any of these fields',
      refreshers: ['contactId'],
      required: true,
      props: async (
        { contactId }: any,
        ctx: PropertyContext
      ): Promise<InputPropertyMap> => {
        if (!contactId) return {};
        const contact = JSON.parse(contactId);

        return {
          firstName: Property.ShortText({
            displayName: 'First Name',
            defaultValue: contact.First_Name ?? '',
            required: false,
          }),
          lastName: Property.ShortText({
            displayName: 'Last Name',
            defaultValue: contact.Last_Name ?? '',
            required: true,
          }),
          email: Property.ShortText({
            displayName: 'Email',
            defaultValue: contact.Email ?? '',
            required: false,
          }),
          mobile: Property.ShortText({
            displayName: 'Mobile Phone Number',
            defaultValue: contact.Mobile ?? '',
            required: false,
          }),
          description: Property.ShortText({
            displayName: 'Description',
            defaultValue: contact.Description ?? '',
            required: false,
          }),
          mailingStreet: Property.ShortText({
            displayName: 'Mailing Street',
            defaultValue: contact.Mailing_Street ?? '',
            required: false,
          }),
          mailingState: Property.ShortText({
            displayName: 'Mailing State',
            defaultValue: contact.Mailing_State ?? '',
            required: false,
          }),
          mailingCity: Property.ShortText({
            displayName: 'Mailing City',
            defaultValue: contact.Mailing_City ?? '',
            required: false,
          }),
          mailingCountry: Property.ShortText({
            displayName: 'Mailing Country',
            defaultValue: contact.Mailing_Country ?? '',
            required: false,
          }),
          mailingZip: Property.ShortText({
            displayName: 'Mailing Zip',
            defaultValue: contact.Mailing_Zip ?? '',
            required: false,
          }),
        };
      },
    }),

    accountName: companyDropdown,
    tag: tagsDropdown('Contacts'),
  },

  async run(context) {
   try {
     const {
       contactDetails: {
         firstName,
         lastName,
         title,
         email,
         mobile,
         emailOptOut,
         owner,
         tag,
         description,
         mailingStreet,
         mailingCity,
         mailingState,
         mailingCountry,
         mailingZip,
       },
       contactId,
       accountName,
     } = context.propsValue;

     const record: Record<string, any> = {
       First_Name: firstName,
       Last_Name: lastName,
       Title: title,
       Email: email,
       Mobile: mobile,
       Email_Opt_Out: emailOptOut,
       Owner: owner ? { id: owner } : undefined,
       Account_Name: accountName ? { id: accountName } : undefined,
       Tag: tag?.length ? tag.map((t: any) => ({ name: t })) : undefined,
       Description: description,
       Mailing_Street: mailingStreet,
       Mailing_City: mailingCity,
       Mailing_State: mailingState,
       Mailing_Country: mailingCountry,
       Mailing_Zip: mailingZip,
       id: JSON.parse(contactId).id,
     };

     Object.keys(record).forEach((k) => {
       const v = record[k];
       if (
         v === undefined ||
         v === null ||
         (typeof v === 'string' && v.trim() === '') ||
         (Array.isArray(v) && v.length === 0)
       ) {
         delete record[k];
       }
     });

     const payload = { data: [record] };

     const resp = await biginApiService.updateContact(
       context.auth.access_token,
       (context.auth as any).api_domain,
       payload
     );

     return {
       message: 'Contact updated successfully',
       data: resp.data[0],
     };
   } catch (error: any) {
    console.error('Error updating contact:', error);
    throw new Error(error);
   }
  },
});
