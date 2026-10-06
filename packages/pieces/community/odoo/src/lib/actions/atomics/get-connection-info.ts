import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient, odooRpc } from '../../common/client';
import { odooRecords } from '../../common/records';
import { atomicSchemas } from './output-schemas';

async function probe({ client, model }: { client: OdooClient; model: string }): Promise<boolean> {
  try {
    await client.call<number>({ model, method: 'search_count', args: [[['id', '=', 0]]] });
    return true;
  } catch (error) {
    if (odooRpc.isMissingModelFault(error)) return false;
    if (odooRpc.isAccessFault(error)) return false;
    throw error;
  }
}

async function installedApps({ client }: { client: OdooClient }): Promise<string[] | null> {
  try {
    const rows = await client.call<{ name: string }[]>({
      model: 'ir.module.module',
      method: 'search_read',
      args: [[['state', '=', 'installed'], ['application', '=', true]]],
      kwargs: { fields: ['name'], order: 'name asc' },
    });
    return rows.map((row) => row.name);
  } catch (error) {
    if (odooRpc.isAccessFault(error)) return null;
    throw error;
  }
}

async function isAdministrator({ client, uid }: { client: OdooClient; uid: number }): Promise<boolean | null> {
  try {
    const result = await client.call<unknown>({ model: 'res.users', method: 'has_group', args: [[uid], 'base.group_system'] });
    return result === true;
  } catch (error) {
    if (!isModelLevelHasGroupFault(error)) return null;
  }
  try {
    const result = await client.call<unknown>({ model: 'res.users', method: 'has_group', args: ['base.group_system'] });
    return result === true;
  } catch {
    return null;
  }
}

function isModelLevelHasGroupFault(error: unknown): boolean {
  return /takes 2 positional arguments/.test(odooRpc.faultText(error));
}

export const odooGetConnectionInfo = createAction({
  auth: odooAuth,
  name: 'odoo_get_connection_info',
  classification: 'READ',
  displayName: 'Get Connection Info',
  description: 'Get the Odoo version, the connected user and which apps can be used.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the Odoo server version, the connected user (id, name, company, language, time zone) and which apps this user can use (contacts, CRM, sales, invoicing, products, project, inventory). Call it first to learn which app-specific actions will work and how field names differ by version. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.connectionInfo,
  props: {},
  async run(context) {
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const version = await client.version();
    const uid = await client.authenticate();
    const user = await odooRecords.readApp({
      client,
      model: 'res.users',
      id: uid,
      wanted: ['name', 'login', 'email', 'company_id', 'lang', 'tz'],
      manyToOne: ['company_id'],
    });
    const probes = await Promise.all(
      odooApps.appProbes.map(async (app): Promise<[string, boolean]> => [app.key, await probe({ client, model: app.model })]),
    );
    const apps = await installedApps({ client });
    const isAdmin = await isAdministrator({ client, uid });
    return {
      server_version: version['server_version'] ?? null,
      server_serie: version['server_serie'] ?? null,
      protocol_version: version['protocol_version'] ?? null,
      database: client.connection.db,
      uid,
      user_name: user['name'] ?? null,
      user_login: user['login'] ?? null,
      user_email: user['email'] ?? null,
      company_id: user['company_id'] ?? null,
      company_id_name: user['company_id_name'] ?? null,
      lang: user['lang'] ?? null,
      tz: user['tz'] ?? null,
      is_admin: isAdmin,
      ...Object.fromEntries(probes),
      installed_apps: apps,
    };
  },
});
