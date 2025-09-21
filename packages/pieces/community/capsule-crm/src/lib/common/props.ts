import { Property } from '@activepieces/pieces-framework';
import { capsuleCrmClient } from './client';

type CapsuleAuth = string;

export const capsuleCrmProps = {
  contact_id: () =>
    Property.Dropdown({
      displayName: 'Contact',
      description: 'The contact (Person or Organisation) to select.',
      required: true,
      refreshers: [],
      options: async (context) => {
        const { auth } = context as { auth?: CapsuleAuth };

        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }

        const searchTerm = (context['searchValue'] as string) ?? '';

        const contacts = await capsuleCrmClient.searchContacts(
          auth,
          searchTerm
        );

        const options = contacts.map((contact) => {
          const label =
            contact.type === 'person'
              ? `${contact.firstName} ${contact.lastName}`
              : contact.name;
          return {
            label: label || 'Unnamed Contact',
            value: contact.id,
          };
        });

        return {
          disabled: false,
          options: options,
        };
      },
    }),
};
