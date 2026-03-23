import {
  ConnectSecretManagerRequest,
  SecretManagerConnectionScope,
  SecretManagerConnectionWithStatus,
  SecretManagerProviderConfig,
  SecretManagerProviderId,
} from '@activepieces/shared';

export const secretManagersUtils = {
  getEmptySecretManagerConfig,
  getDefaultValues,
};

function getEmptySecretManagerConfig(
  providerId: SecretManagerProviderId,
): SecretManagerProviderConfig {
  switch (providerId) {
    case SecretManagerProviderId.HASHICORP:
      return { url: '', roleId: '', secretId: '' };
    case SecretManagerProviderId.AWS:
      return { accessKeyId: '', secretAccessKey: '', region: '' };
    case SecretManagerProviderId.CYBERARK:
      return { organizationAccountName: '', loginId: '', url: '', apiKey: '' };
    case SecretManagerProviderId.ONEPASSWORD:
      return { serviceAccountToken: '' };
  }
}

function getDefaultValues(
  connection: SecretManagerConnectionWithStatus | undefined,
): ConnectSecretManagerRequest {
  const base = connection
    ? {
        name: connection.name,
        scope: connection.scope,
        projectIds:
          connection.scope === SecretManagerConnectionScope.PROJECT
            ? connection.projectIds ?? []
            : [],
      }
    : {
        name: '',
        scope: SecretManagerConnectionScope.PLATFORM,
        projectIds: [] satisfies string[],
      };

  const providerId =
    connection?.providerId ?? SecretManagerProviderId.HASHICORP;

  switch (providerId) {
    case SecretManagerProviderId.HASHICORP:
      return {
        ...base,
        providerId: SecretManagerProviderId.HASHICORP,
        config: { url: '', roleId: '', secretId: '' },
      };
    case SecretManagerProviderId.AWS:
      return {
        ...base,
        providerId: SecretManagerProviderId.AWS,
        config: { accessKeyId: '', secretAccessKey: '', region: '' },
      };
    case SecretManagerProviderId.CYBERARK:
      return {
        ...base,
        providerId: SecretManagerProviderId.CYBERARK,
        config: {
          organizationAccountName: '',
          loginId: '',
          url: '',
          apiKey: '',
        },
      };
    case SecretManagerProviderId.ONEPASSWORD:
      return {
        ...base,
        providerId: SecretManagerProviderId.ONEPASSWORD,
        config: { serviceAccountToken: '' },
      };
  }
}
