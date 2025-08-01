import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../../';
import { missiveApiCall } from '../common/utils';

export const updateContactAction = createAction({
  auth: missiveAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update an existing contact by ID',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact',
      required: false,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      description: 'The middle name of the contact',
      required: false,
    }),
    prefix: Property.ShortText({
      displayName: 'Prefix',
      description: 'The prefix (e.g., Mr., Dr.)',
      required: false,
    }),
    suffix: Property.ShortText({
      displayName: 'Suffix',
      description: 'The suffix (e.g., Jr., Sr.)',
      required: false,
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      description: 'The nickname of the contact',
      required: false,
    }),
    fileAs: Property.ShortText({
      displayName: 'File As',
      description: 'How the contact should be filed',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the contact',
      required: false,
    }),
    starred: Property.Checkbox({
      displayName: 'Starred',
      description: 'Whether the contact is starred',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      description: 'The gender of the contact',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Male', value: 'Male' },
          { label: 'Female', value: 'Female' },
          { label: 'Other', value: 'Other' },
        ],
      },
    }),
    // Email info
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact',
      required: false,
    }),
    emailLabel: Property.StaticDropdown({
      displayName: 'Email Label',
      description: 'The type of email address',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Home', value: 'home' },
          { label: 'Work', value: 'work' },
          { label: 'Personal', value: 'personal' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    emailCustomLabel: Property.ShortText({
      displayName: 'Email Custom Label',
      description: 'Custom label for email (only if label is "other")',
      required: false,
    }),
    // Phone info
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number',
      required: false,
    }),
    phoneLabel: Property.StaticDropdown({
      displayName: 'Phone Label',
      description: 'The type of phone number',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Main', value: 'main' },
          { label: 'Mobile', value: 'mobile' },
          { label: 'Home', value: 'home' },
          { label: 'Work', value: 'work' },
          { label: 'Home Fax', value: 'home_fax' },
          { label: 'Work Fax', value: 'work_fax' },
          { label: 'Other Fax', value: 'other_fax' },
          { label: 'Pager', value: 'pager' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    phoneCustomLabel: Property.ShortText({
      displayName: 'Phone Custom Label',
      description: 'Custom label for phone (only if label is "other")',
      required: false,
    }),
    // Address info
    address: Property.LongText({
      displayName: 'Address',
      description: 'The street address',
      required: false,
    }),
    extendedAddress: Property.ShortText({
      displayName: 'Extended Address',
      description: 'Extended address information (e.g., apartment, office)',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'The city',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State/Region',
      description: 'The state or region',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP/Postal Code',
      description: 'The ZIP or postal code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'The country',
      required: false,
    }),
    poBox: Property.ShortText({
      displayName: 'PO Box',
      description: 'The PO box number',
      required: false,
    }),
    addressLabel: Property.StaticDropdown({
      displayName: 'Address Label',
      description: 'The type of address',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Home', value: 'home' },
          { label: 'Work', value: 'work' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    addressCustomLabel: Property.ShortText({
      displayName: 'Address Custom Label',
      description: 'Custom label for address (only if label is "other")',
      required: false,
    }),
    // Organization membership
    organizationName: Property.ShortText({
      displayName: 'Organization Name',
      description: 'The name of the organization',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The job title in the organization',
      required: false,
    }),
    department: Property.ShortText({
      displayName: 'Department',
      description: 'The department in the organization',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'The location in the organization',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the role',
      required: false,
    }),
  },
  async run(context) {
    const {
      contactId,
      firstName,
      lastName,
      middleName,
      prefix,
      suffix,
      nickname,
      fileAs,
      notes,
      starred,
      gender,
      email,
      emailLabel,
      emailCustomLabel,
      phone,
      phoneLabel,
      phoneCustomLabel,
      address,
      extendedAddress,
      city,
      state,
      zip,
      country,
      poBox,
      addressLabel,
      addressCustomLabel,
      organizationName,
      title,
      department,
      location,
      description,
    } = context.propsValue;

    const apiToken = context.auth.apiToken;

    // Build infos array
    const infos: Record<string, unknown>[] = [];

    // Add email info if provided
    if (email) {
      const emailInfo: Record<string, unknown> = {
        kind: 'email',
        value: email,
        label: emailLabel || 'home',
      };
      if (emailLabel === 'other' && emailCustomLabel) {
        emailInfo.custom_label = emailCustomLabel;
      }
      infos.push(emailInfo);
    }

    // Add phone info if provided
    if (phone) {
      const phoneInfo: Record<string, unknown> = {
        kind: 'phone_number',
        value: phone,
        label: phoneLabel || 'mobile',
      };
      if (phoneLabel === 'other' && phoneCustomLabel) {
        phoneInfo.custom_label = phoneCustomLabel;
      }
      infos.push(phoneInfo);
    }

    // Add address info if provided
    if (address || city || state || zip || country) {
      const addressInfo: Record<string, unknown> = {
        kind: 'physical_address',
        label: addressLabel || 'home',
      };
      
      if (address) addressInfo.street = address;
      if (extendedAddress) addressInfo.extended_address = extendedAddress;
      if (city) addressInfo.city = city;
      if (state) addressInfo.region = state;
      if (zip) addressInfo.postal_code = zip;
      if (country) addressInfo.country = country;
      if (poBox) addressInfo.po_box = poBox;
      
      if (addressLabel === 'other' && addressCustomLabel) {
        addressInfo.custom_label = addressCustomLabel;
      }
      
      infos.push(addressInfo);
    }

    // Build memberships array
    const memberships: Record<string, unknown>[] = [];

    // Add organization membership if provided
    if (organizationName) {
      const membership: Record<string, unknown> = {
        group: {
          kind: 'organization',
          name: organizationName,
        },
      };
      
      if (title) membership.title = title;
      if (department) membership.department = department;
      if (location) membership.location = location;
      if (description) membership.description = description;
      
      memberships.push(membership);
    }

    // Build contact object
    const contact: Record<string, unknown> = {
      id: contactId,
    };

    if (firstName) contact.first_name = firstName;
    if (lastName) contact.last_name = lastName;
    if (middleName) contact.middle_name = middleName;
    if (prefix) contact.prefix = prefix;
    if (suffix) contact.suffix = suffix;
    if (nickname) contact.nickname = nickname;
    if (fileAs) contact.file_as = fileAs;
    if (notes) contact.notes = notes;
    if (starred !== undefined) contact.starred = starred;
    if (gender) contact.gender = gender;
    if (infos.length > 0) contact.infos = infos;
    if (memberships.length > 0) contact.memberships = memberships;

    const response = await missiveApiCall(
      apiToken,
      `/contacts/${contactId}`,
      HttpMethod.PATCH,
      { contacts: [contact] }
    );

    return response;
  },
}); 