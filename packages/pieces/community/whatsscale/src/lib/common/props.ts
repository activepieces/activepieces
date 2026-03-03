import { Property, DropdownState } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../auth';
import { whatsscaleClient } from './client';

/**
 * Reusable dropdown props shared across actions.
 *
 * Sprint 1: session only.
 * Sprint 2 will add: contact, group, channel, crmContact, crmTag.
 */
export const whatsscaleProps = {
  session: Property.Dropdown<string, true, typeof whatsscaleAuth>({
    auth: whatsscaleAuth,
    displayName: 'WhatsApp Session',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      try {
        const response = await whatsscaleClient(
          auth.secret_text,
          HttpMethod.GET,
          '/make/sessions',
        );
        const sessions = response.body as { label: string; value: string }[];
        if (!sessions || sessions.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder:
              'No sessions found. Connect WhatsApp at whatsscale.com',
          };
        }
        return {
          disabled: false,
          options: sessions,
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading sessions',
        };
      }
    },
  }),
};
