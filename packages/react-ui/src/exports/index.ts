/**
 * Activepieces React UI - Export Barrel
 *
 * This file exports the main components, providers, and utilities
 * needed for embedding Activepieces in external applications.
 */

// Main Components
export { BuilderPage } from '../app/builder';
export { FlowsTable } from '../app/routes/flows/flows-table';

// State Providers
export { BuilderStateProvider } from '../app/builder/state/builder-state-provider';

// UI Providers
export { ThemeProvider } from '../components/theme-provider';

// API and Authentication
export { api, API_BASE_URL, API_URL } from '../lib/api';
export { authenticationSession } from '../lib/authentication-session';

// Feature APIs
export { flowsApi } from '../features/flows/lib/flows-api';

// Hooks
export { useBuilderStateContext } from '../app/builder/builder-hooks';
