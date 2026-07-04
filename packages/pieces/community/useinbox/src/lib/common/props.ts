import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { useinboxClient } from './client';
import { useinboxAuth } from './auth';

type BasicAuthValue = { username: string; password: string };

type InboxList<T> = {
  resultStatus: boolean;
  resultCode: number;
  resultMessage: string;
  resultObject?: {
    displayCount?: number;
    totalCount?: number;
    items?: T;
  };
};

type ContactList = {
  id: string;
  listName: string;
  totalContacts?: number;
};

type Newsletter = {
  id: string;
  name: string;
  subject?: string;
};

type Sender = {
  id: string;
  displayName: string;
  email: string;
  isVerified?: boolean;
};

type Group = {
  id: string;
  groupName: string;
};

type CustomField = {
  id: string;
  fieldName: string;
  fieldType?: string;
};

async function withToken<T>({
  auth,
  fn,
}: {
  auth: BasicAuthValue;
  fn: (token: string) => Promise<T>;
}): Promise<T> {
  const token = await useinboxClient.fetchAccessToken({
    email: auth.username,
    password: auth.password,
  });
  return await fn(token);
}

function disconnectedDropdown(message = 'Please connect your INBOX account first.') {
  return { disabled: true, options: [], placeholder: message };
}

export const useinboxProps = {
  contactListDropdown: (params?: { displayName?: string; required?: boolean; description?: string }) =>
    Property.Dropdown({
      auth: useinboxAuth,
      displayName: params?.displayName ?? 'Contact List',
      description:
        params?.description ??
        'Select the INBOX contact list. Lists are managed under Contacts > Lists in your dashboard.',
      required: params?.required ?? true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return disconnectedDropdown();
        try {
          const data = await withToken({
            auth: auth as BasicAuthValue,
            fn: async (token) => {
              const response = await useinboxClient.inboxApiCall<InboxList<ContactList[]>>({
                token,
                service: 'inbox',
                method: HttpMethod.GET,
                path: '/contactlists',
              });
              return response.body?.resultObject?.items ?? [];
            },
          });
          if (data.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No contact lists found. Create one in INBOX first.',
            };
          }
          return {
            disabled: false,
            options: data.map((list) => ({
              label: list.totalContacts !== undefined
                ? `${list.listName} (${list.totalContacts} contacts)`
                : list.listName,
              value: list.id,
            })),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load contact lists. Check your credentials.',
          };
        }
      },
    }),
  multiselectContactListDropdown: (params?: { displayName?: string; required?: boolean; description?: string }) =>
    Property.MultiSelectDropdown({
      auth: useinboxAuth,
      displayName: params?.displayName ?? 'Contact Lists',
      description:
        params?.description ??
        'Select one or more INBOX contact lists. Lists are managed under Contacts > Lists in your dashboard.',
      required: params?.required ?? true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return disconnectedDropdown();
        try {
          const data = await withToken({
            auth: auth as BasicAuthValue,
            fn: async (token) => {
              const response = await useinboxClient.inboxApiCall<InboxList<ContactList[]>>({
                token,
                service: 'inbox',
                method: HttpMethod.GET,
                path: '/contactlists',
              });
              return response.body?.resultObject?.items ?? [];
            },
          });
          if (data.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No contact lists found. Create one in INBOX first.',
            };
          }
          return {
            disabled: false,
            options: data.map((list) => ({
              label: list.totalContacts !== undefined
                ? `${list.listName} (${list.totalContacts} contacts)`
                : list.listName,
              value: list.id,
            })),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load contact lists. Check your credentials.',
          };
        }
      },
    }),

  newsletterDropdown: (params?: { displayName?: string; required?: boolean; description?: string }) =>
    Property.Dropdown({
      auth: useinboxAuth,
      displayName: params?.displayName ?? 'Newsletter',
      description:
        params?.description ??
        'Select the newsletter template to send. Newsletters are created under Newsletters in your INBOX dashboard.',
      required: params?.required ?? true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return disconnectedDropdown();
        try {
          const data = await withToken({
            auth: auth as BasicAuthValue,
            fn: async (token) => {
              const response = await useinboxClient.inboxApiCall<InboxList<Newsletter[]>>({
                token,
                service: 'inbox',
                method: HttpMethod.GET,
                path: '/newsletters',
              });
              return response.body?.resultObject?.items ?? [];
            },
          });
          if (data.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No newsletters found. Create one in INBOX first.',
            };
          }
          return {
            disabled: false,
            options: data.map((nl) => ({
              label: nl.subject ? `${nl.name} — ${nl.subject}` : nl.name,
              value: nl.id,
            })),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load newsletters. Check your credentials.',
          };
        }
      },
    }),

  senderDropdown: (params?: { displayName?: string; required?: boolean; service?: 'inbox' | 'notify'; description?: string }) =>
    Property.Dropdown({
      auth: useinboxAuth,
      displayName: params?.displayName ?? 'Sender',
      description:
        params?.description ??
        'Select the verified sender that emails will be sent from. Senders are managed under Settings > Senders.',
      required: params?.required ?? true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return disconnectedDropdown();
        try {
          const data = await withToken({
            auth: auth as BasicAuthValue,
            fn: async (token) => {
              const response = await useinboxClient.inboxApiCall<InboxList<Sender[]>>({
                token,
                service: params?.service ?? 'inbox',
                method: HttpMethod.GET,
                path: '/senders',
              });
              return response.body?.resultObject?.items ?? [];
            },
          });
          if (data.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No verified senders found. Add one in INBOX first.',
            };
          }
          return {
            disabled: false,
            options: data.map((s) => ({
              label: `${s.displayName} <${s.email}>${s.isVerified === false ? ' (unverified)' : ''}`,
              value: s.id,
            })),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load senders. Check your credentials.',
          };
        }
      },
    }),

  groupDropdown: (params?: { displayName?: string; required?: boolean; description?: string }) =>
    Property.Dropdown({
      auth: useinboxAuth,
      displayName: params?.displayName ?? 'Group',
      description:
        params?.description ??
        'Optional. Group used to organize contact lists. Pick one to keep your lists tidy.',
      required: params?.required ?? false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return disconnectedDropdown();
        try {
          const data = await withToken({
            auth: auth as BasicAuthValue,
            fn: async (token) => {
              const response = await useinboxClient.inboxApiCall<InboxList<Group[]>>({
                token,
                service: 'inbox',
                method: HttpMethod.GET,
                path: '/groups',
              });
              return response.body?.resultObject?.items ?? [];
            },
          });
          if (data.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No groups found. Skip this field to leave it ungrouped.',
            };
          }
          return {
            disabled: false,
            options: data.map((g) => ({
              label: g.groupName,
              value: g.id,
            })),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load groups. Check your credentials.',
          };
        }
      },
    }),

  contactDropdown: (params?: { displayName?: string; required?: boolean; description?: string }) =>
    Property.Dropdown({ 
      auth: useinboxAuth,
      displayName: params?.displayName ?? 'Contact',
      description:
        params?.description ??
        'Select the contact to update. Contacts are listed under Contacts in your INBOX dashboard.',
      required: params?.required ?? true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return disconnectedDropdown();
        try {
          const data = await withToken({
            auth: auth as BasicAuthValue,
            fn: async (token) => {
              const response = await useinboxClient.inboxApiCall<
                InboxList<Array<{ id: string; email: string; firstName?: string; lastName?: string }>>
              >({
                token,
                service: 'inbox',
                method: HttpMethod.GET,
                path: '/contacts',
              });
              return response.body?.resultObject?.items ?? [];
            },
          });
          if (data.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No contacts found. Add one in INBOX first.',
            };
          }
          return {
            disabled: false,
            options: data.map((c) => {
              const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
              return {
                label: name ? `${name} (${c.email})` : c.email,
                value: c.id,
              };
            }),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load contacts. Check your credentials.',
          };
        }
      },
    }),

  // customFieldsArray: () =>
  //   Property.Array({
  //     displayName: 'Custom Fields',
  //     description:
  //       'Optional. Map values to INBOX custom fields you have defined. Pick the field and enter the value for this contact.',
  //     required: false,
  //     properties: {
  //       customFieldId: Property.Dropdown({
  //         auth: useinboxAuth,
  //         displayName: 'Field',
  //         description: 'Pick the INBOX custom field to fill in.',
  //         required: true,
  //         refreshers: [],
  //         options: async ({ auth }) => {
  //           if (!auth) return disconnectedDropdown();
  //           try {
  //             const data = await withToken({
  //               auth: auth as BasicAuthValue,
  //               fn: async (token) => {
  //                 const response = await useinboxClient.inboxApiCall<InboxList<CustomField[]>>({
  //                   token,
  //                   service: 'inbox',
  //                   method: HttpMethod.GET,
  //                   path: '/customfields',
  //                 });
  //                 return response.body?.resultObject ?? [];
  //               },
  //             });
  //             if (data.length === 0) {
  //               return {
  //                 disabled: false,
  //                 options: [],
  //                 placeholder: 'No custom fields found. Define them in INBOX first.',
  //               };
  //             }
  //             return {
  //               disabled: false,
  //               options: data.map((f) => ({
  //                 label: f.fieldType ? `${f.fieldName} (${f.fieldType})` : f.fieldName,
  //                 value: f.id,
  //               })),
  //             };
  //           } catch (e) {
  //             return {
  //               disabled: true,
  //               options: [],
  //               placeholder: 'Failed to load custom fields.',
  //             };
  //           }
  //         },
  //       }),
  //       value: Property.ShortText({
  //         displayName: 'Value',
  //         description: 'The value to store for this custom field on the contact.',
  //         required: true,
  //       }),
  //     },
  //   }),
};
