const { Pool, Client, types } = require('pg');
import {
  AppSystemProp,
} from '@activepieces/server-shared';
import { system } from '../helper/system/system'
const database = system.getOrThrow(AppSystemProp.POSTGRES_DATABASE);
const host = system.getOrThrow(AppSystemProp.POSTGRES_HOST);
const password = system.getOrThrow(AppSystemProp.POSTGRES_PASSWORD);
const serializedPort = system.getOrThrow(AppSystemProp.POSTGRES_PORT);
const port = Number.parseInt(serializedPort, 10);
const username = system.getOrThrow(AppSystemProp.POSTGRES_USERNAME);

let pool = null;
let dbinfo = {
  // connectionString: pgConString,
  host: host,
  database: database,
  user: username,
  password: password,
  port: port,
  // max: maxuse,
  // min: minuse,
  application_name: 'test-pool',
  keepAlive: true,
  // idleTimeoutMillis: idleuseTimeout,
  // connectionTimeoutMillis: conuseTimeout,
  ssl: false,
};
pool = new Pool(dbinfo);
module.exports = { pool };
