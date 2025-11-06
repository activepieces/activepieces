import { Property } from '@activepieces/pieces-framework';
import { WhatConvertsAuth } from './auth';
import { whatConvertsClient } from './client';

export const whatConvertsProps = {
  account_id: () =>
    Property.Dropdown({
      displayName: 'Account',
      description: 'The account to select a profile from.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first.',
            options: [],
          };
        }
        const accounts = await whatConvertsClient.getAccounts(
          auth as WhatConvertsAuth
        );
        return {
          disabled: false,
          options: accounts.map((account) => ({
            label: account.account_name,
            value: account.account_id,
          })),
        };
      },
    }),
  profile_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Profile',
      description: 'The profile to search for leads in.',
      required: required,
      refreshers: ['auth', 'account_id'],
      options: async ({ auth, account_id }) => {
        if (!auth || !account_id) {
          return {
            disabled: true,
            placeholder: 'Please select an account first.',
            options: [],
          };
        }
        const profiles = await whatConvertsClient.getProfiles(
          auth as WhatConvertsAuth,
          account_id as number
        );
        return {
          disabled: false,
          options: profiles.map((profile) => ({
            label: profile.profile_name,
            value: profile.profile_id,
          })),
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
        const response = await whatConvertsClient.findLeads(
          auth as WhatConvertsAuth,
          {
            profile_id: profile_id as number,
            per_page: 50,
          }
        );
        return {
          disabled: false,
          options: (response.leads || []).map((lead) => {
            const emailDetail = lead.lead_details?.find(
              (d) => d.label === 'Email'
            );
            const nameDetail = lead.lead_details?.find(
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
