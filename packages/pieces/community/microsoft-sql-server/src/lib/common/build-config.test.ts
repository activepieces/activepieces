import { AppConnectionType } from '@activepieces/pieces-framework';
import { describe, expect, it } from 'vitest';
import { mssqlCommon, MssqlAuth } from '.';

function auth(props: Partial<MssqlAuth['props']>): MssqlAuth {
  return {
    type: AppConnectionType.CUSTOM_AUTH,
    props: {
      encrypt: true,
      trust_server_certificate: false,
      ...props,
    },
  } as MssqlAuth;
}

describe('buildConfig', () => {
  it('builds an Entra ID service-principal config when tenant, client id and secret are set', () => {
    const config = mssqlCommon.buildConfig({
      auth: auth({
        host: 'myserver.database.windows.net',
        database: 'mydb',
        tenant_id: 'tenant-1',
        client_id: 'client-1',
        client_secret: 'secret-1',
      }),
    });

    expect(config.authentication).toEqual({
      type: 'azure-active-directory-service-principal-secret',
      options: {
        clientId: 'client-1',
        clientSecret: 'secret-1',
        tenantId: 'tenant-1',
      },
    });
    expect(config.user).toBeUndefined();
    expect(config.password).toBeUndefined();
    expect(config.server).toBe('myserver.database.windows.net');
  });

  it('rejects a partial service-principal configuration', () => {
    expect(() =>
      mssqlCommon.buildConfig({
        auth: auth({
          host: 'myserver.database.windows.net',
          tenant_id: 'tenant-1',
          client_id: 'client-1',
        }),
      })
    ).toThrow(
      'Tenant ID, Client ID and Client Secret are all required to authenticate with Microsoft Entra ID.'
    );
  });

  it('requires a host for service-principal authentication', () => {
    expect(() =>
      mssqlCommon.buildConfig({
        auth: auth({
          tenant_id: 'tenant-1',
          client_id: 'client-1',
          client_secret: 'secret-1',
        }),
      })
    ).toThrow('Host is required to authenticate with Microsoft Entra ID.');
  });

  it('still builds SQL-auth config when no service-principal fields are set', () => {
    const config = mssqlCommon.buildConfig({
      auth: auth({
        host: 'myserver.database.windows.net',
        user: 'sa',
        password: 'pw',
      }),
    });

    expect(config.authentication).toBeUndefined();
    expect(config.user).toBe('sa');
    expect(config.password).toBe('pw');
  });
});
