import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { PieceCategory } from '@activepieces/shared';
import { uploadFile } from './lib/actions/upload-file';
import { createRow } from './lib/actions/create-row';
import { deleteRows } from './lib/actions/delete-rows';
import { updateRow } from './lib/actions/update-row';
import { upsertRow } from './lib/actions/upsert-row';
import { searchRows } from './lib/actions/search-rows';
import { newRow } from './lib/triggers/new-row';
import { supabaseAuth } from './lib/auth';

const markdown = `
## Supabase Connection Setup

### 1. Get Your Project URL
- Go to your [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project
- Go to **Settings** → **API**
- Copy the **Project URL** (format: \`https://your-project-ref.supabase.co\`)

### 2. Get Your API Key
Choose the appropriate key based on your use case:

**For Actions (Database Operations):**
- Use **Service Role Key** (secret) for server-side operations
- Has full access to bypass Row Level Security (RLS)

**For Triggers (Webhooks):**
- Use **Anonymous Key** (public) if your webhooks don't need elevated permissions
- Use **Service Role Key** for elevated permissions

**Security Note:** Keep your Service Role Key secret - it bypasses all RLS policies.

Find your keys in **Settings** → **API** → **Project API keys**
`;

export const supabase = createPiece({
  displayName: 'Supabase',
  description: 'The open-source Firebase alternative',
  auth: supabaseAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/supabase.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ["kishanprmr","MoShizzle","abuaboud","fortunamide"],
  actions: [
    uploadFile,
    createRow,
    updateRow,
    upsertRow,
    deleteRows,
    searchRows,
    createCustomApiCallAction({
      baseUrl: (auth) => auth?.props?.url || '',
      auth: supabaseAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.apiKey}`,
      }),
    }),
  ],
  triggers: [
    newRow,
  ],
});
