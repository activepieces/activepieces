import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { listIdDropdown, ListprofileIdsMultiSelectDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

interface KlaviyoProfile {
    id: string;
    attributes: {
        first_name?: string;
        last_name?: string;
        email?: string;
    };
}

export const unsubscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'unsubscribeProfile',
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribe profiles from email or SMS lists.',
  props: {
    list_id: listIdDropdown,
    mode: Property.StaticDropdown({
      displayName: 'Profile Selection Mode',
      description: 'Choose how to select profiles to unsubscribe',
      required: true,
      defaultValue: 'existing',
      options: {
        disabled: false,
        options: [
          { label: 'Select Existing Profiles', value: 'existing' },
          { label: 'Add New Profiles by Email/Phone', value: 'new' },
        ],
      },
    }),
    profile_ids: Property.MultiSelectDropdown({
      displayName: 'Profile Ids',
      description: 'Select one or more Klaviyo profiles',
      required: false,
      refreshers: ['auth', 'list_id', 'mode'],
      options: async ({ auth, list_id, mode }) => {
        if ((mode as unknown as string) !== 'existing') {
          return {
            disabled: true,
            options: [],
          };
        }
        
        if (!auth || !list_id) {
          return {
            disabled: true,
            placeholder: 'Connect your account and select a list',
            options: [],
          };
        }
        
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const profiles = await makeRequest(authProp.access_token, HttpMethod.GET, `/lists/${list_id}/profiles`, {});

        const options = (profiles.data as KlaviyoProfile[]).map((field) => {
          const firstName = field.attributes.first_name || '';
          const lastName = field.attributes.last_name || '';
          const email = field.attributes.email || '';
          const label = [firstName, lastName].filter(Boolean).join(' ') + (email ? ` (${email})` : '');
          return {
            label: label || field.id,
            value: field.id,
          };
        });

        return {
          options,
        };
      },
    }),
    profile_selection: Property.DynamicProperties({
      displayName: '',
      refreshers: ['mode'],
      required: false,
      props: async ({ mode }) => {
        const props: any = {};
        
        if ((mode as unknown as string) === 'existing') {
          props.unsubscribe_email = Property.Checkbox({
            displayName: 'Unsubscribe from Email',
            description: 'Unsubscribe from email marketing',
            required: false,
            defaultValue: true,
          });
          props.unsubscribe_sms = Property.Checkbox({
            displayName: 'Unsubscribe from SMS',
            description: 'Unsubscribe from SMS marketing',
            required: false,
            defaultValue: false,
          });
          props.unsubscribe_sms_transactional = Property.Checkbox({
            displayName: 'Unsubscribe from SMS Transactional',
            description: 'Unsubscribe from SMS transactional messages',
            required: false,
            defaultValue: false,
          });
        } else if ((mode as unknown as string) === 'new') {
          props.new_profiles = Property.Array({
            displayName: 'New Profiles',
            description: 'List of new profiles to unsubscribe (max 100)',
            properties: {
              email: Property.ShortText({
                displayName: 'Email',
                description: 'Email address to unsubscribe',
                required: false,
              }),
              phone_number: Property.ShortText({
                displayName: 'Phone Number',
                description: 'Phone number in E.164 format (e.g., +1234567890)',
                required: false,
              }),
              unsubscribe_email: Property.Checkbox({
                displayName: 'Unsubscribe from Email',
                description: 'Unsubscribe from email marketing',
                required: false,
                defaultValue: true,
              }),
              unsubscribe_sms: Property.Checkbox({
                displayName: 'Unsubscribe from SMS',
                description: 'Unsubscribe from SMS marketing',
                required: false,
                defaultValue: false,
              }),
              unsubscribe_sms_transactional: Property.Checkbox({
                displayName: 'Unsubscribe from SMS Transactional',
                description: 'Unsubscribe from SMS transactional messages',
                required: false,
                defaultValue: false,
              }),
            },
            required: false,
          });
        }
        
        return props;
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { 
      list_id, 
      mode, 
      profile_ids, 
      profile_selection 
    } = propsValue;
    
    const new_profiles = profile_selection?.['new_profiles'];
    const unsubscribe_email = profile_selection?.['unsubscribe_email'];
    const unsubscribe_sms = profile_selection?.['unsubscribe_sms'];
    const unsubscribe_sms_transactional = profile_selection?.['unsubscribe_sms_transactional'];

    let validatedProfiles: any[] = [];

    if (mode === 'existing') {
      if (!profile_ids || profile_ids.length === 0) {
        throw new Error('At least one existing profile must be selected');
      }

      if (profile_ids.length > 100) {
        throw new Error('Maximum of 100 profiles can be unsubscribed at once');
      }

      if (!unsubscribe_email && !unsubscribe_sms && !unsubscribe_sms_transactional) {
        throw new Error('At least one unsubscribe option must be selected');
      }

      validatedProfiles = profile_ids.map((profileId: string) => {
        const subscriptions: any = {};
        
        if (unsubscribe_email) {
          subscriptions.email = {
            marketing: { consent: 'UNSUBSCRIBED' },
          };
        }

        if (unsubscribe_sms) {
          subscriptions.sms = subscriptions.sms || {};
          subscriptions.sms.marketing = { consent: 'UNSUBSCRIBED' };
        }

        if (unsubscribe_sms_transactional) {
          subscriptions.sms = subscriptions.sms || {};
          subscriptions.sms.transactional = { consent: 'UNSUBSCRIBED' };
        }

        return {
          type: 'profile',
          id: profileId,
          attributes: {
            subscriptions,
          },
        };
      });

    } else if (mode === 'new') {
      if (!new_profiles || new_profiles.length === 0) {
        throw new Error('At least one new profile is required');
      }

      if (new_profiles.length > 100) {
        throw new Error('Maximum of 100 profiles can be unsubscribed at once');
      }

      validatedProfiles = new_profiles.map((profile: any, index: number) => {
        if (!profile.email && !profile.phone_number) {
          throw new Error(`Profile ${index + 1}: Either email or phone number is required`);
        }

        if (!profile.unsubscribe_email && !profile.unsubscribe_sms && !profile.unsubscribe_sms_transactional) {
          throw new Error(`Profile ${index + 1}: At least one unsubscribe option must be selected`);
        }

        const profileData: any = {
          type: 'profile',
          attributes: {},
        };

        if (profile.email) {
          profileData.attributes.email = profile.email;
        }
        if (profile.phone_number) {
          profileData.attributes.phone_number = profile.phone_number;
        }

        const subscriptions: any = {};
        
        if (profile.unsubscribe_email) {
          subscriptions.email = {
            marketing: { consent: 'UNSUBSCRIBED' },
          };
        }

        if (profile.unsubscribe_sms) {
          subscriptions.sms = subscriptions.sms || {};
          subscriptions.sms.marketing = { consent: 'UNSUBSCRIBED' };
        }

        if (profile.unsubscribe_sms_transactional) {
          subscriptions.sms = subscriptions.sms || {};
          subscriptions.sms.transactional = { consent: 'UNSUBSCRIBED' };
        }

        profileData.attributes.subscriptions = subscriptions;
        return profileData;
      });
    } else {
      throw new Error('Invalid mode selected');
    }

    const body: any = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: validatedProfiles,
          },
        },
      },
    };

    if (list_id) {
      body.data.relationships = {
        list: {
          data: {
            type: 'list',
            id: list_id,
          },
        },
      };
    }

    return await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/profile-subscription-bulk-delete-jobs',
      body
    );
  },
});
