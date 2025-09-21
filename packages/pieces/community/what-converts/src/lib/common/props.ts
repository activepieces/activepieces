import { Property } from '@activepieces/pieces-framework';
import { WhatConvertsAuth } from './auth';
import { whatConvertsClient } from './client';

export const whatConvertsProps = {
  profile_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Profile',
      description: 'The profile to search for leads in.',
      required: required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first.',
            options: [],
          };
        }

        const profiles = await whatConvertsClient.getProfiles(
          auth as WhatConvertsAuth
        );

        return {
          disabled: false,
          options: profiles.map((profile) => {
            return {
              label: profile.profile_name,
              value: profile.profile_id,
            };
          }),
        };
      },
    }),
  lead_id: () =>
    Property.Dropdown({
      displayName: 'Lead',
      description: 'The lead to update.',
      required: true,
      refreshers: ['auth', 'profile_id'],
      options: async ({ auth, profile_id }) => {
        if (!auth || !profile_id) {
          return {
            disabled: true,
            placeholder: 'Please select a profile first.',
            options: [],
          };
        }

        const authValue = auth as WhatConvertsAuth;
        const response = await whatConvertsClient.findLeads(authValue, {
          profile_id: profile_id as number,
          per_page: 2500, 
        });

        return {
          disabled: false,
          options: response.leads.map((lead) => {
            const emailDetail = lead.lead_details.find(
              (d) => d.label === 'Email'
            );
            const nameDetail = lead.lead_details.find(
              (d) => d.label === 'First Name'
            );
            const label = `${
              nameDetail?.value || emailDetail?.value || lead.lead_type
            } (ID: ${lead.lead_id})`;
            return {
              label: label,
              value: lead.lead_id,
            };
          }),
        };
      },
    }),
};
