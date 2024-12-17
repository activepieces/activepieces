import { platformApi } from '@/lib/platforms-api';
import { authenticationSession } from '@/lib/authentication-session';
import { CopilotProvider, CopilotProviderType, CopilotSettings } from '@activepieces/shared';

export type UpsertCopilotProviderRequest = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  type: CopilotProviderType;
  setAsDefault?: boolean;
};

const createEmptySettings = (): CopilotSettings => ({
  providers: [],
  defaultSearchProvider: undefined,
  defaultAssistantProvider: undefined,
});

export const copilotProviderApi = {
  upsert: async (request: UpsertCopilotProviderRequest) => {
    const platformId = authenticationSession.getPlatformId();
    if (!platformId) {
      throw Error('No platform id found');
    }

    const platform = await platformApi.getCurrentPlatform();
    const currentSettings = platform.copilotSettings || createEmptySettings();
    
    // Add new provider
    const newProvider: CopilotProvider = {
      provider: request.provider,
      baseUrl: request.baseUrl,
      apiKey: request.apiKey,
      type: request.type,
    };

    // Remove existing provider if it exists and add new one
    const providers = [...(currentSettings.providers || []).filter(p => p.provider !== request.provider), newProvider];

    // Update default provider if requested
    const defaultKey = request.type === CopilotProviderType.SEARCH 
      ? 'defaultSearchProvider' 
      : 'defaultAssistantProvider';

    const newSettings: CopilotSettings = {
      providers,
      defaultSearchProvider: currentSettings.defaultSearchProvider,
      defaultAssistantProvider: currentSettings.defaultAssistantProvider,
      ...(request.setAsDefault ? { [defaultKey]: request.provider } : {}),
    };

    return platformApi.update({
      copilotSettings: newSettings,
    }, platformId);
  },

  delete: async (providerName: string) => {
    const platformId = authenticationSession.getPlatformId();
    if (!platformId) {
      throw Error('No platform id found');
    }

    const platform = await platformApi.getCurrentPlatform();
    const currentSettings = platform.copilotSettings || createEmptySettings();

    const newSettings: CopilotSettings = {
      providers: (currentSettings.providers || []).filter(p => p.provider !== providerName),
      defaultSearchProvider: currentSettings.defaultSearchProvider === providerName 
        ? undefined 
        : currentSettings.defaultSearchProvider,
      defaultAssistantProvider: currentSettings.defaultAssistantProvider === providerName 
        ? undefined 
        : currentSettings.defaultAssistantProvider,
    };

    return platformApi.update({
      copilotSettings: newSettings,
    }, platformId);
  },
}; 