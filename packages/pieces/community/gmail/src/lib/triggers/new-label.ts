import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

interface LabelInfo {
  id: string;
  name: string;
  messageListVisibility: string;
  labelListVisibility: string;
  type: string;
  color?: {
    textColor: string;
    backgroundColor: string;
  };
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
}

async function getAllLabels(gmail: any): Promise<LabelInfo[]> {
  const response = await gmail.users.labels.list({
    userId: 'me',
  });

  return (response.data.labels || []).map((label: any) => ({
    id: label.id,
    name: label.name,
    messageListVisibility: label.messageListVisibility || 'show',
    labelListVisibility: label.labelListVisibility || 'labelShow',
    type: label.type || 'user',
    color: label.color ? {
      textColor: label.color.textColor || '#000000',
      backgroundColor: label.color.backgroundColor || '#ffffff',
    } : undefined,
    messagesTotal: label.messagesTotal || 0,
    messagesUnread: label.messagesUnread || 0,
    threadsTotal: label.threadsTotal || 0,
    threadsUnread: label.threadsUnread || 0,
  }));
}

function filterUserLabels(labels: LabelInfo[]): LabelInfo[] {
  const systemLabelPrefixes = [
    'INBOX', 'SPAM', 'TRASH', 'UNREAD', 'STARRED', 'IMPORTANT',
    'SENT', 'DRAFT', 'CATEGORY_', 'CHAT', 'PERSONAL', 'SOCIAL',
    'PROMOTIONS', 'UPDATES', 'FORUMS'
  ];

  return labels.filter(label => {
    if (label.type === 'user') return true;
    
    const isSystemLabel = systemLabelPrefixes.some(prefix => 
      label.id.startsWith(prefix) || label.name.startsWith(prefix)
    );
    
    return !isSystemLabel;
  });
}

export const gmailNewLabelTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_label',
  displayName: 'New Label',
  description: 'Triggers when a new label is created in Gmail',
  props: {
    includeSystemLabels: Property.Checkbox({
      displayName: 'Include System Labels',
      description: 'Include system-generated labels (categories, etc.) in addition to user-created labels',
      required: false,
      defaultValue: false,
    }),
    nameContains: Property.ShortText({
      displayName: 'Label Name Contains',
      description: 'Only trigger for labels containing this text in the name (optional)',
      required: false,
    }),
    visibilityFilter: Property.StaticDropdown({
      displayName: 'Visibility Filter',
      description: 'Filter by label list visibility (optional)',
      required: false,
      options: {
        options: [
          { label: 'All Labels', value: 'all' },
          { label: 'Visible Labels Only', value: 'labelShow' },
          { label: 'Hidden Labels Only', value: 'labelHide' },
        ],
      },
      defaultValue: 'all',
    }),
    includeColorInfo: Property.Checkbox({
      displayName: 'Include Color Information',
      description: 'Include label color settings in the trigger data',
      required: false,
      defaultValue: true,
    }),
    includeStats: Property.Checkbox({
      displayName: 'Include Message Statistics',
      description: 'Include message and thread counts for the new label',
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const allLabels = await getAllLabels(gmail);
    const userLabels = context.propsValue.includeSystemLabels ? allLabels : filterUserLabels(allLabels);
    
    const existingLabelIds = userLabels.map(label => label.id);
    await context.store.put('knownLabelIds', existingLabelIds);
    await context.store.put('triggerEnabled', Date.now());
  },
  onDisable: async (context) => {
    await context.store.delete('knownLabelIds');
    await context.store.delete('triggerEnabled');
  },
  run: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    try {
      const allLabels = await getAllLabels(gmail);
      const currentLabels = context.propsValue.includeSystemLabels ? allLabels : filterUserLabels(allLabels);
      
      const knownLabelIds = (await context.store.get<string[]>('knownLabelIds')) || [];
      
      const newLabels = currentLabels.filter(label => !knownLabelIds.includes(label.id));
      
      const results: any[] = [];
      
      for (const label of newLabels) {
        let shouldInclude = true;
        
        if (context.propsValue.nameContains) {
          const nameFilter = context.propsValue.nameContains.toLowerCase();
          if (!label.name.toLowerCase().includes(nameFilter)) {
            shouldInclude = false;
          }
        }
        
        if (shouldInclude && context.propsValue.visibilityFilter && context.propsValue.visibilityFilter !== 'all') {
          if (label.labelListVisibility !== context.propsValue.visibilityFilter) {
            shouldInclude = false;
          }
        }
        
        if (shouldInclude) {
          let detailedLabel = { ...label };
          
          if (context.propsValue.includeStats) {
            try {
              const labelResponse = await gmail.users.labels.get({
                userId: 'me',
                id: label.id,
              });
              
              const labelData = labelResponse.data;
              detailedLabel = {
                ...detailedLabel,
                messagesTotal: labelData.messagesTotal || 0,
                messagesUnread: labelData.messagesUnread || 0,
                threadsTotal: labelData.threadsTotal || 0,
                threadsUnread: labelData.threadsUnread || 0,
              };
            } catch (error) {
              console.warn(`Failed to get detailed stats for label ${label.id}:`, error);
            }
          }
          
          const labelType = getLabelType(label);
          const isNested = label.name.includes('/');
          const parentLabel = isNested ? label.name.substring(0, label.name.lastIndexOf('/')) : null;
          
          const triggerData = {
            label: {
              id: detailedLabel.id,
              name: detailedLabel.name,
              displayName: detailedLabel.name.split('/').pop() || detailedLabel.name,
              fullPath: detailedLabel.name,
              type: detailedLabel.type,
              labelType: labelType,
              visibility: {
                messageList: detailedLabel.messageListVisibility,
                labelList: detailedLabel.labelListVisibility,
              },
            },
            hierarchy: {
              isNested: isNested,
              parentLabel: parentLabel,
              depth: (detailedLabel.name.match(/\//g) || []).length,
              pathComponents: detailedLabel.name.split('/'),
            },
            triggerInfo: {
              type: 'new_label',
              detectedAt: new Date().toISOString(),
              filters: {
                includeSystemLabels: context.propsValue.includeSystemLabels,
                nameContains: context.propsValue.nameContains,
                visibilityFilter: context.propsValue.visibilityFilter,
                includeColorInfo: context.propsValue.includeColorInfo,
                includeStats: context.propsValue.includeStats,
              },
            },
          };
          
          if (context.propsValue.includeColorInfo && detailedLabel.color) {
            (triggerData.label as any).color = {
              textColor: detailedLabel.color.textColor,
              backgroundColor: detailedLabel.color.backgroundColor,
              textColorName: getColorName(detailedLabel.color.textColor),
              backgroundColorName: getColorName(detailedLabel.color.backgroundColor),
            };
          }
          
          if (context.propsValue.includeStats) {
            (triggerData.label as any).statistics = {
              messages: {
                total: detailedLabel.messagesTotal || 0,
                unread: detailedLabel.messagesUnread || 0,
              },
              threads: {
                total: detailedLabel.threadsTotal || 0,
                unread: detailedLabel.threadsUnread || 0,
              },
            };
          }
          
          results.push({
            id: `new_label_${label.id}`,
            data: triggerData,
          });
        }
      }
      
      const currentLabelIds = currentLabels.map(label => label.id);
      await context.store.put('knownLabelIds', currentLabelIds);
      
      return results;
    } catch (error: any) {
      console.error('Error in new label trigger:', error);
      throw error;
    }
  },
  test: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const allLabels = await getAllLabels(gmail);
    const testLabels = context.propsValue.includeSystemLabels ? allLabels : filterUserLabels(allLabels);
    
    const results: any[] = [];
    
    for (const label of testLabels.slice(0, 3)) {
      let shouldInclude = true;
      
      if (context.propsValue.nameContains) {
        const nameFilter = context.propsValue.nameContains.toLowerCase();
        if (!label.name.toLowerCase().includes(nameFilter)) {
          shouldInclude = false;
        }
      }
      
      if (shouldInclude && context.propsValue.visibilityFilter && context.propsValue.visibilityFilter !== 'all') {
        if (label.labelListVisibility !== context.propsValue.visibilityFilter) {
          shouldInclude = false;
        }
      }
      
      if (shouldInclude) {
        let detailedLabel = { ...label };
        
        if (context.propsValue.includeStats) {
          try {
            const labelResponse = await gmail.users.labels.get({
              userId: 'me',
              id: label.id,
            });
            
            const labelData = labelResponse.data;
            detailedLabel = {
              ...detailedLabel,
              messagesTotal: labelData.messagesTotal || 0,
              messagesUnread: labelData.messagesUnread || 0,
              threadsTotal: labelData.threadsTotal || 0,
              threadsUnread: labelData.threadsUnread || 0,
            };
          } catch (error) {
            console.warn(`Failed to get detailed stats for label ${label.id} in test:`, error);
          }
        }
        
        const labelType = getLabelType(label);
        const isNested = label.name.includes('/');
        const parentLabel = isNested ? label.name.substring(0, label.name.lastIndexOf('/')) : null;
        
        const triggerData = {
          label: {
            id: detailedLabel.id,
            name: detailedLabel.name,
            displayName: detailedLabel.name.split('/').pop() || detailedLabel.name,
            fullPath: detailedLabel.name,
            type: detailedLabel.type,
            labelType: labelType,
            visibility: {
              messageList: detailedLabel.messageListVisibility,
              labelList: detailedLabel.labelListVisibility,
            },
          },
          hierarchy: {
            isNested: isNested,
            parentLabel: parentLabel,
            depth: (detailedLabel.name.match(/\//g) || []).length,
            pathComponents: detailedLabel.name.split('/'),
          },
          triggerInfo: {
            type: 'new_label',
            detectedAt: new Date().toISOString(),
            testMode: true,
            filters: {
              includeSystemLabels: context.propsValue.includeSystemLabels,
              nameContains: context.propsValue.nameContains,
              visibilityFilter: context.propsValue.visibilityFilter,
              includeColorInfo: context.propsValue.includeColorInfo,
              includeStats: context.propsValue.includeStats,
            },
          },
        };
        
         if (context.propsValue.includeColorInfo && detailedLabel.color) {
           (triggerData.label as any).color = {
             textColor: detailedLabel.color.textColor,
             backgroundColor: detailedLabel.color.backgroundColor,
             textColorName: getColorName(detailedLabel.color.textColor),
             backgroundColorName: getColorName(detailedLabel.color.backgroundColor),
           };
         }
         
         if (context.propsValue.includeStats) {
           (triggerData.label as any).statistics = {
             messages: {
               total: detailedLabel.messagesTotal || 0,
               unread: detailedLabel.messagesUnread || 0,
             },
             threads: {
               total: detailedLabel.threadsTotal || 0,
               unread: detailedLabel.threadsUnread || 0,
             },
           };
         }
        
        results.push({
          id: `test_new_label_${label.id}`,
          data: triggerData,
        });
      }
    }
    
    return results;
  },
});

function getLabelType(label: LabelInfo): string {
  if (label.type === 'system') return 'system';
  
  if (label.name.includes('/')) return 'nested';
  if (label.name.toLowerCase().includes('project')) return 'project';
  if (label.name.toLowerCase().includes('client')) return 'client';
  if (label.name.toLowerCase().includes('urgent') || label.name.toLowerCase().includes('priority')) return 'priority';
  if (label.name.toLowerCase().includes('archive')) return 'archive';
  
  return 'general';
}

function getColorName(hexColor: string): string {
  const colorMap: { [key: string]: string } = {
    '#000000': 'Black',
    '#434343': 'Dark Gray',
    '#666666': 'Gray',
    '#999999': 'Light Gray',
    '#cccccc': 'Very Light Gray',
    '#efefef': 'Almost White',
    '#f3f3f3': 'Off White',
    '#ffffff': 'White',
    '#fb4c2f': 'Red',
    '#ffad47': 'Orange',
    '#fad165': 'Yellow',
    '#16a766': 'Green',
    '#43d692': 'Light Green',
    '#4a86e8': 'Blue',
    '#a479e2': 'Purple',
    '#f691b3': 'Pink',
    '#f6c5be': 'Light Pink',
    '#ffe6cc': 'Light Orange',
    '#fef1d1': 'Light Yellow',
    '#b9e4d0': 'Light Green Alt',
    '#c6f3de': 'Very Light Green',
    '#c9daf8': 'Light Blue',
    '#e4d7f5': 'Light Purple',
    '#fcdee8': 'Very Light Pink',
  };
  
  return colorMap[hexColor] || hexColor;
} 