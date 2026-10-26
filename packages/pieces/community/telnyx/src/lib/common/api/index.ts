import { telnyxAccountNotificationsApi } from './account-notifications';
import { telnyxCallsApi } from './calls';
import { telnyxConferencesApi } from './conferences';
import { telnyxConnectionsApi } from './connections';
import { telnyxCoreApi } from './core';
import { telnyxMessagingApi } from './messaging';
import { telnyxMessagingProfilesApi } from './messaging-profiles';
import { telnyxNetworkingApi } from './networking';
import { telnyxPhoneNumbersApi } from './phone-numbers';
import { telnyxRecordingsMediaApi } from './recordings-media';
import { telnyxVerifyApi } from './verify';

export const telnyxApi = {
	...telnyxCoreApi,
	...telnyxMessagingApi,
	...telnyxMessagingProfilesApi,
	...telnyxPhoneNumbersApi,
	...telnyxCallsApi,
	...telnyxConferencesApi,
	...telnyxRecordingsMediaApi,
	...telnyxVerifyApi,
	...telnyxConnectionsApi,
	...telnyxAccountNotificationsApi,
	...telnyxNetworkingApi,
};
