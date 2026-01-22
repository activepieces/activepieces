import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Account actions
import { get_me } from './lib/actions/account/get-me';

// Client actions  
import { bulk_delete_clients } from './lib/actions/clients/bulk-delete-clients';
import { create_client_property } from './lib/actions/clients/create-client-property';
import { create_clients } from './lib/actions/clients/create-clients';
import { get_clients } from './lib/actions/clients/get-clients';

// Vehicle actions
import { create_vehicle } from './lib/actions/vehicles/create-vehicle';
import { delete_vehicle } from './lib/actions/vehicles/delete-vehicle';
import { get_vehicle } from './lib/actions/vehicles/get-vehicle';
import { get_vehicles } from './lib/actions/vehicles/get-vehicles';

// Visit actions
import { add_visit_items } from './lib/actions/visits/add-visit-items';
import { create_visits } from './lib/actions/visits/create-visits';
import { delete_visit } from './lib/actions/visits/delete-visit';
import { get_visit } from './lib/actions/visits/get-visit';
import { get_visit_detail } from './lib/actions/visits/get-visit-detail';
import { get_visits } from './lib/actions/visits/get-visits';
import { update_visit } from './lib/actions/visits/update-visit';
import { update_visit_partial } from './lib/actions/visits/update-visit-partial';

// Route actions
import { create_route } from './lib/actions/routes/create-route';
import { delete_route } from './lib/actions/routes/delete-route';
import { get_route } from './lib/actions/routes/get-route';
import { get_routes } from './lib/actions/routes/get-routes';

// Plan actions
import { create_plan } from './lib/actions/plans/create-plan';
import { get_plan_vehicles } from './lib/actions/plans/get-plan-vehicles';
import { get_plans } from './lib/actions/plans/get-plans';

// User actions
import { create_users } from './lib/actions/users/create-users';
import { get_drivers } from './lib/actions/users/get-drivers';
import { get_user } from './lib/actions/users/get-user';
import { update_user } from './lib/actions/users/update-user';

// Metadata actions
import { get_fleets } from './lib/actions/metadata/get-fleets';
import { get_observations } from './lib/actions/metadata/get-observations';
import { get_sellers } from './lib/actions/metadata/get-sellers';
import { get_skills } from './lib/actions/metadata/get-skills';
import { get_tags } from './lib/actions/metadata/get-tags';
import { get_zones } from './lib/actions/metadata/get-zones';

export const simplirouteAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your SimpliRoute API token. You can find this in your SimpliRoute account settings under API section.',
  validate: async (auth) => {
    try {
      console.log('Auth validation - received auth:', typeof auth, auth);
      const token = typeof auth === 'string' ? auth : (auth as { auth?: string })?.auth || auth;
      console.log('Auth validation - extracted token:', token);
      
      if (!token || typeof token !== 'string') {
        return {
          valid: false,
          error: 'Invalid token format'
        };
      }
      
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.simpliroute.com/v1/accounts/api-token/${token}/validate/`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 200 && response.body && response.body.isvalid === true) {
        return {
          valid: true
        };
      }
      
      return {
        valid: false,
        error: 'Invalid API token or authentication failed'
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate API token. Please check your token and try again.'
      };
    }
  }
});

export const simpliroute = createPiece({
  displayName: 'SimpliRoute',
  description: 'Connect with SimpliRoute, the last-mile delivery optimization platform. Manage clients, vehicles, visits, routes, and optimize your delivery operations.',
  logoUrl: 'https://cdn.activepieces.com/pieces/simpliroute.png',
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['rfjaimes-simpli'],
  auth: simplirouteAuth,
  actions: [
    get_me,
    get_clients,
    create_clients,
    bulk_delete_clients,
    create_client_property,
    get_vehicles,
    create_vehicle,
    get_vehicle,
    delete_vehicle,
    get_visits,
    create_visits,
    get_visit,
    update_visit_partial,
    update_visit,
    delete_visit,
    add_visit_items,
    get_routes,
    create_route,
    get_route,
    delete_route,
    get_plans,
    create_plan,
    get_plan_vehicles,
    get_visit_detail,
    get_drivers,
    create_users,
    get_user,
    update_user,
    get_skills,
    get_observations,
    get_tags,
    get_zones,
    get_fleets,
    get_sellers,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.simpliroute.com',
      auth: simplirouteAuth,
      authMapping: async (auth) => ({
        Authorization: `Token ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
