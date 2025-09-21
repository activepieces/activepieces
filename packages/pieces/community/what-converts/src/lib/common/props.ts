import { Property , DropdownProperty } from '@activepieces/pieces-framework';
import { whatConvertsClient } from './client';

export const leadDropdown = () =>
  Property.Dropdown({
    displayName: 'Lead',
    description: 'The ID of the lead to update.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account first',
          options: [],
        };
      }
      const response = await whatConvertsClient.getLeads(auth as any);
      
      return {
        disabled: false,
        options: response.leads.map((lead: any) => {
          const leadDate = new Date(lead.date_created).toLocaleDateString();
          const leadIdentifier = lead.contact_name || lead.caller_number || lead.contact_email_address || `from ${lead.lead_source}`;
          return {
            label: `Lead from ${leadIdentifier} on ${leadDate} (ID: ${lead.lead_id})`,
            value: lead.lead_id,
          };
        }),
      };
    },
  });


export const profileDropdown = (overrides: Partial<DropdownProperty<string, false>> = {}) =>
  Property.Dropdown({
    displayName: 'Profile',
    description: 'Select the profile to export leads from.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
              disabled: true,
              placeholder: 'Connect your account first',
              options: [],
            };
        }
        const response = await whatConvertsClient.getProfiles(auth as any);
        return {
            disabled: false,
            options: response.profiles.map((profile: any) => {
                return {
                    label: profile.profile_name,
                    value: profile.profile_id
                }
            })
        }
    },
  });


  export const searchByDropdown = () =>
    Property.StaticDropdown({
        displayName: 'Search By',
        description: 'The field to search for the lead by.',
        required: true,
        options: {
            options: [
                { label: 'Lead ID', value: 'id' },
                { label: 'Email Address', value: 'email' },
                { label: 'Phone Number', value: 'phone' },
            ],
        },
    });


