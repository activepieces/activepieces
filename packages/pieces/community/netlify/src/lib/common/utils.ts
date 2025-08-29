import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { NetlifyClient } from './client';

// Common property definitions
export const siteIdProperty = Property.Dropdown({
  displayName: 'Site',
  description: 'Select the Netlify site',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Netlify account first',
        options: []
      };
    }

    try {
      const client = new NetlifyClient(auth as string);
      const sites = await client.getSites();
      
      return {
        options: sites.map((site: any) => ({
          label: site.name || site.url || site.id,
          value: site.id
        }))
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load sites',
        options: []
      };
    }
  }
});

export const deployIdProperty = Property.ShortText({
  displayName: 'Deploy ID',
  description: 'The unique identifier of the deployment',
  required: true
});

export const filePathProperty = Property.ShortText({
  displayName: 'File Path',
  description: 'Path to the file (e.g., index.html, assets/style.css)',
  required: true
});

// Utility functions
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

export function cleanupData(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

export function formatDeployStatus(status: string): string {
  switch (status) {
    case 'new':
      return 'New';
    case 'building':
      return 'Building';
    case 'uploading':
      return 'Uploading';
    case 'processing':
      return 'Processing';
    case 'ready':
      return 'Ready';
    case 'error':
      return 'Error';
    case 'stopped':
      return 'Stopped';
    default:
      return status;
  }
}

export function formatDeployContext(context: string): string {
  switch (context) {
    case 'production':
      return 'Production';
    case 'deploy-preview':
      return 'Deploy Preview';
    case 'branch-deploy':
      return 'Branch Deploy';
    default:
      return context;
  }
}

export function isValidSiteId(siteId: string): boolean {
  // Netlify site IDs are typically UUIDs or custom names
  return siteId && siteId.trim().length > 0;
}

export function isValidDeployId(deployId: string): boolean {
  // Netlify deploy IDs are typically UUIDs
  return deployId && deployId.trim().length > 0;
}

export function parseWebhookEvent(eventType: string): { event: string; action?: string } {
  // Parse Netlify webhook event types like "deploy_created", "deploy_succeeded", etc.
  const parts = eventType.split('_');
  if (parts.length >= 2) {
    return {
      event: parts[0],
      action: parts.slice(1).join('_')
    };
  }
  return { event: eventType };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const duration = end.getTime() - start.getTime();
  
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
