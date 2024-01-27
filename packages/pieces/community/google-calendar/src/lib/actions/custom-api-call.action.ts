/* eslint-disable @typescript-eslint/no-explicit-any */
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { googleCalendarCommon } from '../common';
import { googleCalendarAuth } from '../../index';


export const gCalendarCustomApiCallAction = createCustomApiCallAction({
    baseUrl() {
        return googleCalendarCommon.baseUrl;
    },
    auth: googleCalendarAuth,
    authMapping: (auth) => {
      return {
        'Authorization': `Bearer ${auth}`
      }
    }
});