import { StaticPropsValue } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';

export type OracleDbAuth = StaticPropsValue<(typeof oracleDbAuth)['props']>;
