import {
  PieceAuth,
  Property,
  OAuth2AuthorizationMethod,
} from '@activepieces/pieces-framework';
import snowflake from 'snowflake-sdk';

// Suppress the SDK's verbose INFO/DEBUG logs so they don't corrupt stdout IPC
snowflake.configure({ logLevel: 'ERROR' } as Parameters<
  typeof snowflake.configure
>[0]);

function formatPrivateKey(privateKey: string): string {
  const lines = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .trim()
    .split(' ');
  return [
    '-----BEGIN PRIVATE KEY-----',
    ...lines,
    '-----END PRIVATE KEY-----',
  ].join('\n');
}

function connectAsync(conn: snowflake.Connection): Promise<void> {
  return new Promise((resolve, reject) =>
    conn.connect((err) => (err ? reject(err) : resolve()))
  );
}

function destroyAsync(conn: snowflake.Connection): Promise<void> {
  return new Promise((resolve, reject) =>
    conn.destroy((err) => (err ? reject(err) : resolve()))
  );
}

export const snowflakeOAuth2Auth = PieceAuth.OAuth2({
  displayName: 'OAuth',
  description: `Connect via Snowflake OAuth using a custom security integration.

> **Prerequisite:** You need the \`ACCOUNTADMIN\` role (or a role with the \`CREATE INTEGRATION\` privilege).

---

### Step 1 — Create a security integration

Open a **SQL Worksheet** in your Snowflake console and run:

\`\`\`sql
CREATE SECURITY INTEGRATION "activepieces"
  TYPE = OAUTH
  OAUTH_CLIENT = CUSTOM
  OAUTH_CLIENT_TYPE = 'CONFIDENTIAL'
  OAUTH_REDIRECT_URI = 'https://cloud.activepieces.com/redirect'
  ENABLED = TRUE
  OAUTH_ISSUE_REFRESH_TOKENS = TRUE;
\`\`\`

> Replace the redirect URI with the one shown on your Activepieces OAuth connection page.

---

### Step 2 — Retrieve client credentials

Run the following query to get your **Client ID** and **Client Secret**:

\`\`\`sql
SELECT SYSTEM$SHOW_OAUTH_CLIENT_SECRETS('activepieces');
\`\`\`

Copy \`OAUTH_CLIENT_ID\` and \`OAUTH_CLIENT_SECRET\` from the JSON result.

---

### Step 3 — Find your Account Identifier

Click the **account icon** at the bottom-left of the Snowflake console → **View account details**.
Copy the **Account Identifier** (e.g. \`xy12345.us-east-1\` or \`orgname-accountname\`).

---

### Step 4 — Connect

Enter the **Client ID** and **Client Secret** in the Activepieces OAuth2 settings for this connection, fill in the **Account Identifier** below, then click **Connect**.`,
  authUrl: 'https://{account}.snowflakecomputing.com/oauth/authorize',
  tokenUrl: 'https://{account}.snowflakecomputing.com/oauth/token-request',
  scope: ['session:role-any', 'refresh_token'],
  pkce: false,
  authorizationMethod: OAuth2AuthorizationMethod.BODY,
  required: true,
  props: {
    account: Property.ShortText({
      displayName: 'Account Identifier',
      required: true,
      description:
        'Account icon (bottom-left) → **View account details** → copy the **Account Identifier**. Examples: `xy12345.us-east-1`, `orgname-accountname`.',
    }),
    database: Property.ShortText({
      displayName: 'Default Database',
      required: false,
      description:
        'Optional. Default database for queries. Find names under **Data → Databases**.',
    }),
    warehouse: Property.ShortText({
      displayName: 'Default Warehouse',
      required: false,
      description:
        'Optional. Default virtual warehouse. Find names under **Admin → Warehouses**.',
    }),
    role: Property.ShortText({
      displayName: 'Default Role',
      required: false,
      description:
        'Optional. Default security role. Find names under **Admin → Users & Roles → Roles**.',
    }),
  },
  validate: async ({ auth }) => {
    try {
      const conn = snowflake.createConnection({
        account: auth.props!['account'] as string,
        authenticator: 'OAUTH',
        token: auth.access_token,
        database: auth.props!['database'] as string | undefined,
        warehouse: auth.props!['warehouse'] as string | undefined,
        role: auth.props!['role'] as string | undefined,
        application: 'ActivePieces',
      });
      await connectAsync(conn);
      await destroyAsync(conn);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },
});

export const snowflakeCustomAuth = PieceAuth.CustomAuth({
  displayName: 'Username & Password / Key Pair',
  description: `Connect using your Snowflake username with either a **password** or an **RSA private key**.

### Finding your Account Identifier

Click the **account icon** at the bottom-left of the Snowflake console → **View account details**.
Copy the **Account Identifier** (e.g. \`xy12345.us-east-1\` or \`orgname-accountname\`).

---

### Option A — Password

Use your Snowflake username and the password you use to log in at [app.snowflake.com](https://app.snowflake.com).
Your username is shown in the profile section at the top-left of the console, or under **Admin → Users & Roles → Users**.

---

### Option B — Key Pair *(recommended for automation)*

**1. Generate a key pair** (run in your terminal):

\`\`\`bash
# Unencrypted (no passphrase needed)
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out rsa_key.p8
openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub

# Encrypted (you will be prompted for a passphrase)
openssl genrsa 2048 | openssl pkcs8 -topk8 -out rsa_key_encrypted.p8
openssl rsa -in rsa_key_encrypted.p8 -pubout -out rsa_key.pub
\`\`\`

**2. Register the public key** with your Snowflake user (run in a SQL Worksheet):

\`\`\`sql
ALTER USER <your_username>
  SET RSA_PUBLIC_KEY='<contents of rsa_key.pub, excluding the BEGIN/END lines>';
\`\`\`

**3. Paste the private key** — copy the full contents of \`rsa_key.p8\` (including the \`-----BEGIN PRIVATE KEY-----\` header and footer) into the **Private Key** field below.`,
  props: {
    account: Property.ShortText({
      displayName: 'Account Identifier',
      required: true,
      description:
        'Account icon (bottom-left) → **View account details** → copy the **Account Identifier**. Examples: `xy12345.us-east-1`, `orgname-accountname`.',
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
      description:
        'Your Snowflake login name. Shown in the profile section (top-left of the console) or under **Admin → Users & Roles → Users**.',
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description:
        'Your Snowflake password *(Option A)*. Leave blank if you are using a Private Key.',
      required: false,
    }),
    privateKey: PieceAuth.SecretText({
      displayName: 'Private Key',
      description:
        'RSA private key in PEM format *(Option B)*. Paste the full contents of your `.p8` file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines. Leave blank if you are using a Password.',
      required: false,
    }),
    privateKeyPassphrase: PieceAuth.SecretText({
      displayName: 'Private Key Passphrase',
      description:
        'Passphrase for the private key. Only required if you generated an **encrypted** key pair.',
      required: false,
    }),
    database: Property.ShortText({
      displayName: 'Default Database',
      description:
        'Optional. Default database for queries. Find names under **Data → Databases**.',
      required: false,
    }),
    role: Property.ShortText({
      displayName: 'Default Role',
      description:
        'Optional. Default security role. Find names under **Admin → Users & Roles → Roles**.',
      required: false,
    }),
    warehouse: Property.ShortText({
      displayName: 'Default Warehouse',
      description:
        'Optional. Default virtual warehouse. Find names under **Admin → Warehouses**.',
      required: false,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    if (!auth.password && !auth.privateKey) {
      return {
        valid: false,
        error: 'Either Password or Private Key must be provided.',
      };
    }
    try {
      const connectionOptions: snowflake.ConnectionOptions = {
        account: auth.account,
        username: auth.username,
        database: auth.database,
        warehouse: auth.warehouse,
        role: auth.role,
        application: 'ActivePieces',
      };
      if (auth.privateKey) {
        connectionOptions.authenticator = 'SNOWFLAKE_JWT';
        connectionOptions.privateKey = formatPrivateKey(auth.privateKey);
        if (auth.privateKeyPassphrase) {
          connectionOptions.privateKeyPass = auth.privateKeyPassphrase;
        }
      } else {
        connectionOptions.password = auth.password;
      }
      const conn = snowflake.createConnection(connectionOptions);
      await connectAsync(conn);
      await destroyAsync(conn);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },
});

export const snowflakeAuth = [snowflakeOAuth2Auth, snowflakeCustomAuth];
