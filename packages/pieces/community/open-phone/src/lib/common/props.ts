import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  openPhoneCommon,
  OpenPhoneContactsListResponse,
  OpenPhoneCallsListResponse,
  OpenPhoneNumbersListResponse,
} from './index';

export const contactDropdown = Property.Dropdown({
  displayName: 'Contact',
  description: 'Select a contact',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your OpenPhone account first',
      };
    }

    try {
      const response: OpenPhoneContactsListResponse =
        await openPhoneCommon.makeRequest<OpenPhoneContactsListResponse>(
          HttpMethod.GET,
          '/v1/contacts?maxResults=50',
          auth as string
        );

      const options = response.data.map((contact) => {
        const displayName =
          [contact.defaultFields.firstName, contact.defaultFields.lastName]
            .filter(Boolean)
            .join(' ') || 'Unnamed Contact';

        const company = contact.defaultFields.company;
        const label = company ? `${displayName} (${company})` : displayName;

        return {
          label,
          value: contact.id,
        };
      });

      return {
        disabled: false,
        options: options.sort((a, b) => a.label.localeCompare(b.label)),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading contacts: ${error}`,
      };
    }
  },
});

export const phoneNumberDropdown = Property.Dropdown({
  displayName: 'Phone Number',
  description: 'Select a phone number to get calls from',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your OpenPhone account first',
      };
    }

    try {
      const phoneNumbersResponse: OpenPhoneNumbersListResponse =
        await openPhoneCommon.makeRequest<OpenPhoneNumbersListResponse>(
          HttpMethod.GET,
          '/v1/phone-numbers',
          auth as string
        );

      if (
        !phoneNumbersResponse.data ||
        phoneNumbersResponse.data.length === 0
      ) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No phone numbers found',
        };
      }

      const options = phoneNumbersResponse.data.map((phoneNumber) => {
        const displayName =
          phoneNumber.name || phoneNumber.formattedNumber || phoneNumber.number;
        const numberInfo = phoneNumber.formattedNumber || phoneNumber.number;
        const label = phoneNumber.name
          ? `${displayName} (${numberInfo})`
          : displayName;

        return {
          label,
          value: phoneNumber.id,
        };
      });

      return {
        disabled: false,
        options: options.sort((a, b) => a.label.localeCompare(b.label)),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading phone numbers: ${error}`,
      };
    }
  },
});

export const participantDropdown = Property.Dropdown({
  displayName: 'Participant Phone Number',
  description: 'Select a participant phone number to filter calls',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your OpenPhone account first',
      };
    }

    try {
      const contactsResponse: OpenPhoneContactsListResponse =
        await openPhoneCommon.makeRequest<OpenPhoneContactsListResponse>(
          HttpMethod.GET,
          '/v1/contacts?maxResults=50',
          auth as string
        );

      const phoneNumbers = new Set<string>();

      contactsResponse.data.forEach((contact) => {
        if (contact.defaultFields.phoneNumbers) {
          contact.defaultFields.phoneNumbers.forEach((phone) => {
            if (phone.value) {
              phoneNumbers.add(phone.value);
            }
          });
        }
      });

      if (phoneNumbers.size === 0) {
        return {
          disabled: false,
          options: [
            {
              label: 'Enter phone number manually (+1234567890)',
              value: 'manual',
            },
          ],
          placeholder: 'No contact phone numbers found',
        };
      }

      const options = Array.from(phoneNumbers).map((phoneNumber) => ({
        label: phoneNumber,
        value: phoneNumber,
      }));

      return {
        disabled: false,
        options: options.sort((a, b) => a.label.localeCompare(b.label)),
      };
    } catch (error) {
      return {
        disabled: false,
        options: [
          {
            label: 'Enter phone number manually (+1234567890)',
            value: 'manual',
          },
        ],
        placeholder: `Error loading participants: ${error}`,
      };
    }
  },
});

export const callDropdown = Property.Dropdown({
  displayName: 'Call',
  description: 'Select a call',
  required: true,
  refreshers: ['phoneNumberId', 'participantNumber'],
  options: async ({ auth, phoneNumberId, participantNumber }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your OpenPhone account first',
      };
    }

    if (!phoneNumberId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a phone number first',
      };
    }

    if (!participantNumber || participantNumber === 'manual') {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a participant phone number first',
      };
    }

    try {
      const encodedParticipant = encodeURIComponent(
        participantNumber as string
      );
      const callsResponse: OpenPhoneCallsListResponse =
        await openPhoneCommon.makeRequest<OpenPhoneCallsListResponse>(
          HttpMethod.GET,
          `/v1/calls?phoneNumberId=${phoneNumberId}&participants=${encodedParticipant}&maxResults=50`,
          auth as string
        );

      if (!callsResponse.data || callsResponse.data.length === 0) {
        return {
          disabled: false,
          options: [
            {
              label: 'No calls found - Enter Call ID manually',
              value: 'manual',
            },
          ],
          placeholder: 'No calls available for selection',
        };
      }

      const options = callsResponse.data.map((call) => {
        const statusInfo = call.status ? ` - ${call.status}` : '';
        const durationInfo = call.duration ? ` (${call.duration}s)` : '';
        const dateInfo = new Date(call.createdAt).toLocaleDateString();
        const directionInfo = call.direction === 'incoming' ? '↓' : '↑';

        return {
          label: `${directionInfo} ${call.id}${statusInfo}${durationInfo} - ${dateInfo}`,
          value: call.id,
        };
      });

      return {
        disabled: false,
        options: options.sort((a, b) => b.label.localeCompare(a.label)),
      };
    } catch (error) {
      return {
        disabled: false,
        options: [
          {
            label: 'Enter Call ID manually (AC...)',
            value: 'manual',
          },
        ],
        placeholder: `Error loading calls: ${error}`,
      };
    }
  },
});
