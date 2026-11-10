import {
  AppConnectionValueForAuthProperty,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  openPhoneCommon,
  OpenPhoneContact,
  OpenPhoneContactsListResponse,
  OpenPhoneCall,
  OpenPhoneCallsListResponse,
  OpenPhoneNumbersListResponse,
} from './index';
import { openPhoneAuth } from '../auth';

export const contactDropdown = Property.Dropdown({
  auth: openPhoneAuth,

  displayName: 'Contact',
  description: 'Shows up to 2,000 contacts, sorted by name.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your OpenPhone account first',
      };
    }

    try {
      const contacts = await listAllContacts({ auth });

      if (contacts.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No contacts found in this workspace',
        };
      }

      const options = contacts.map((contact) => {
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
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not load contacts. Check your connection.',
      };
    }
  },
});

export const phoneNumberDropdown = ({
  description,
}: {
  description: string;
}) =>
  Property.Dropdown({
    auth: openPhoneAuth,
    displayName: 'OpenPhone Number',
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your OpenPhone account first',
        };
      }

      try {
        const phoneNumbersResponse: OpenPhoneNumbersListResponse =
          await openPhoneCommon.makeRequest<OpenPhoneNumbersListResponse>(
            HttpMethod.GET,
            '/v1/phone-numbers',
            auth
          );

        if (
          !phoneNumbersResponse.data ||
          phoneNumbersResponse.data.length === 0
        ) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No phone numbers found in this workspace',
          };
        }

        const options = phoneNumbersResponse.data.map((phoneNumber) => {
          const displayName =
            phoneNumber.name ||
            phoneNumber.formattedNumber ||
            phoneNumber.number;
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
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load phone numbers. Check your connection.',
        };
      }
    },
  });

export const participantDropdown = Property.Dropdown({
  auth: openPhoneAuth,
  displayName: 'Participant Phone Number',
  description: "The other person's number, from your contacts.",
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your OpenPhone account first',
      };
    }

    try {
      const contacts = await listAllContacts({ auth });

      const phoneNumbers = new Set<string>();

      contacts.forEach((contact) => {
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
          disabled: true,
          options: [],
          placeholder: 'No phone numbers found in your contacts',
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
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not load contacts. Check your connection.',
      };
    }
  },
});

export const callDropdown = Property.Dropdown({
  auth: openPhoneAuth,
  displayName: 'Call',
  description: 'The call to summarize.',
  required: true,
  refreshers: ['phoneNumberId', 'participantNumber'],
  options: async ({ auth, phoneNumberId, participantNumber }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your OpenPhone account first',
      };
    }

    if (!phoneNumberId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Select an OpenPhone number first',
      };
    }

    if (!participantNumber || participantNumber === 'manual') {
      return {
        disabled: true,
        options: [],
        placeholder: 'Select a participant phone number first',
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
          auth
        );

      if (!callsResponse.data || callsResponse.data.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No calls found with this number',
        };
      }

      return {
        disabled: false,
        options: callsResponse.data.map((call) => ({
          label: buildCallLabel({ call }),
          value: call.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not load calls. Check your connection.',
      };
    }
  },
});

async function listAllContacts({
  auth,
}: {
  auth: AppConnectionValueForAuthProperty<typeof openPhoneAuth>;
}): Promise<OpenPhoneContact[]> {
  const contacts: OpenPhoneContact[] = [];
  let pageToken: string | null = null;

  for (let page = 0; page < MAX_CONTACT_PAGES; page++) {
    const tokenQuery: string = pageToken
      ? `&pageToken=${encodeURIComponent(pageToken)}`
      : '';
    const response: OpenPhoneContactsListResponse =
      await openPhoneCommon.makeRequest<OpenPhoneContactsListResponse>(
        HttpMethod.GET,
        `/v1/contacts?maxResults=50${tokenQuery}`,
        auth
      );

    contacts.push(...response.data);
    pageToken = response.nextPageToken;

    if (!pageToken) {
      break;
    }
  }

  return contacts;
}

function buildCallLabel({ call }: { call: OpenPhoneCall }): string {
  const direction = call.direction === 'incoming' ? 'Incoming' : 'Outgoing';
  const date = new Date(call.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  const parts = [direction, date];

  if (call.duration > 0) {
    parts.push(formatDuration({ seconds: call.duration }));
  }

  if (call.status && call.status !== 'completed') {
    parts.push(call.status);
  }

  return parts.join(' · ');
}

function formatDuration({ seconds }: { seconds: number }): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

const MAX_CONTACT_PAGES = 40;
