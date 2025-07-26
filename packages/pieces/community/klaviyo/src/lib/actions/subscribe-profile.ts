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

export const subscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'subscribeProfile',
  displayName: 'Subscribe Profile',
  description: 'Subscribe profiles to email or SMS lists.',
  props: {
    list_id: listIdDropdown,
    mode: Property.StaticDropdown({
      displayName: 'Profile Selection Mode',
      description: 'Choose how to select profiles to subscribe',
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
          props.subscribe_email = Property.Checkbox({
            displayName: 'Subscribe to Email',
            description: 'Subscribe to email marketing',
            required: false,
            defaultValue: true,
          });
          props.subscribe_sms = Property.Checkbox({
            displayName: 'Subscribe to SMS',
            description: 'Subscribe to SMS marketing',
            required: false,
            defaultValue: false,
          });
        } else if ((mode as unknown as string) === 'new') {
          // Show new profile array input
          props.new_profiles = Property.Array({
            displayName: 'New Profiles',
            description: 'List of new profiles to subscribe (max 1000)',
            properties: {
              email: Property.ShortText({
                displayName: 'Email',
                description: 'Email address (preferred identifier)',
                required: false,
              }),
              phone_number: Property.ShortText({
                displayName: 'Phone Number',
                description: 'Phone number in E.164 format (e.g., +1234567890)',
                required: false,
              }),
              external_id: Property.ShortText({
                displayName: 'External ID',
                description: 'Unique identifier from your system',
                required: false,
              }),
              subscribe_email: Property.Checkbox({
                displayName: 'Subscribe to Email',
                description: 'Subscribe this profile to email marketing',
                required: false,
                defaultValue: true,
              }),
              subscribe_sms: Property.Checkbox({
                displayName: 'Subscribe to SMS',
                description: 'Subscribe this profile to SMS marketing',
                required: false,
                defaultValue: false,
              }),
              consented_at: Property.ShortText({
                displayName: 'Consent Date',
                description: 'ISO 8601 datetime when consent was given (required for historical import)',
                required: false,
              }),
            },
            required: false,
          });
          props.custom_source = Property.ShortText({
            displayName: 'Custom Source',
            description: 'Source of the subscription (optional)',
            required: false,
          });
          props.historical_import = Property.Checkbox({
            displayName: 'Historical Import',
            description: 'Mark as historical import to bypass double opt-in',
            required: false,
            defaultValue: false,
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
      profile_selection,
    } = propsValue;

    const new_profiles = (profile_selection as any)?.new_profiles;
    const subscribe_email = (profile_selection as any)?.subscribe_email;
    const subscribe_sms = (profile_selection as any)?.subscribe_sms;
    const custom_source = (profile_selection as any)?.custom_source;
    const historical_import = (profile_selection as any)?.historical_import;

    let validatedProfiles: any[] = [];

    if (mode === 'existing') {
      if (!profile_ids || profile_ids.length === 0) {
        throw new Error('At least one existing profile must be selected');
      }

      if (profile_ids.length > 1000) {
        throw new Error('Maximum of 1000 profiles can be subscribed at once');
      }

      if (!subscribe_email && !subscribe_sms) {
        throw new Error('At least one subscription option must be selected');
      }

      validatedProfiles = profile_ids.map((profileId: string) => {
        const subscriptions: any = {};
        
        if (subscribe_email) {
          subscriptions.email = {
            marketing: { consent: 'SUBSCRIBED' },
          };
        }

        if (subscribe_sms) {
          subscriptions.sms = {
            marketing: { consent: 'SUBSCRIBED' },
          };
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

      if (new_profiles.length > 1000) {
        throw new Error('Maximum of 1000 profiles can be subscribed at once');
      }

      validatedProfiles = new_profiles.map((profile: any, index: number) => {
        if (!profile.email && !profile.phone_number) {
          throw new Error(`Profile ${index + 1}: Either email or phone number is required`);
        }

        if (historical_import && !profile.consented_at) {
          throw new Error(`Profile ${index + 1}: Consent date is required for historical import`);
        }

        if (profile.consented_at && new Date(profile.consented_at) > new Date()) {
          throw new Error(`Profile ${index + 1}: Consent date must be in the past`);
        }

        if (!profile.subscribe_email && !profile.subscribe_sms) {
          throw new Error(`Profile ${index + 1}: At least one subscription option must be selected`);
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
        if (profile.external_id) {
          profileData.attributes.external_id = profile.external_id;
        }

        const subscriptions: any = {};
        
        if (profile.subscribe_email) {
          const emailSubscription: any = {
            marketing: { consent: 'SUBSCRIBED' },
          };
          
          if (historical_import && profile.consented_at) {
            emailSubscription.marketing.consented_at = profile.consented_at;
          }
          
          subscriptions.email = emailSubscription;
        }

        if (profile.subscribe_sms) {
          const smsSubscription: any = {
            marketing: { consent: 'SUBSCRIBED' },
          };
          
          if (historical_import && profile.consented_at) {
            smsSubscription.marketing.consented_at = profile.consented_at;
          }
          
          subscriptions.sms = smsSubscription;
        }

        profileData.attributes.subscriptions = subscriptions;

        return profileData;
      });
    }

    const requestBody: any = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: {
            data: validatedProfiles,
          },
        },
      },
    };

    if (list_id) {
      requestBody.data.relationships = {
        list: {
          data: {
            type: 'list',
            id: list_id,
          },
        },
      };
    }

    if (custom_source) {
      requestBody.data.attributes.custom_source = custom_source;
    }

    if (historical_import) {
      requestBody.data.attributes.historical_import = true;
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/profile-subscription-bulk-create-jobs',
      requestBody
    );

    return {
      success: true,
      message: `Successfully initiated subscription for ${validatedProfiles.length} profile(s)`,
      job_id: response.data.id,
      profiles_count: validatedProfiles.length,
      list_id: list_id || 'Account default',
      historical_import: historical_import || false,
      custom_source: custom_source || 'Activepieces',
    };
  },
});
