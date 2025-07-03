import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

// Dynamic signal categorization based on signal names
const categorizeSignal = (signalName: string): { category: string; friendlyName: string; type: 'boolean' | 'numeric'; unit?: string; description: string } => {
  const name = signalName.toLowerCase();
  
  // Boolean signals (typically 0/1 values)
  const booleanPatterns = [
    'isopen', 'ison', 'isactive', 'isenabled', 'ischarging', 'ismoving', 'isrunning', 'islocked',
    'door', 'window', 'hood', 'trunk', 'ignition'
  ];
  
  const isBoolean = booleanPatterns.some(pattern => name.includes(pattern)) || 
                   name.startsWith('is') || name.includes('open') || name.includes('locked');
  
  // Auto-categorize by signal name patterns
  if (name.includes('speed') || name.includes('velocity')) {
    return {
      category: 'Vehicle Movement',
      friendlyName: 'Vehicle Speed',
      type: 'numeric',
      unit: 'km/h',
      description: 'Current speed of the vehicle'
    };
  }
  
  if (name.includes('ignition')) {
    return {
      category: 'Vehicle Movement', 
      friendlyName: 'Ignition Status',
      type: 'boolean',
      description: 'Whether the vehicle ignition is on or off'
    };
  }
  
  if (name.includes('battery') || name.includes('charge') || name.includes('stateofcharge')) {
    if (name.includes('charging') && isBoolean) {
      return {
        category: 'Battery & Charging',
        friendlyName: 'Charging Status', 
        type: 'boolean',
        description: 'Whether the vehicle is currently charging'
      };
    }
    if (name.includes('power')) {
      return {
        category: 'Battery & Charging',
        friendlyName: 'Battery Power',
        type: 'numeric',
        unit: 'watts',
        description: 'Current battery power draw or generation'
      };
    }
    return {
      category: 'Battery & Charging',
      friendlyName: 'Battery Level',
      type: 'numeric', 
      unit: '%',
      description: 'Current battery charge percentage'
    };
  }
  
  if (name.includes('fuel')) {
    if (name.includes('relative') || name.includes('percent')) {
      return {
        category: 'Fuel System',
        friendlyName: 'Fuel Level (%)',
        type: 'numeric',
        unit: '%',
        description: 'Fuel level as percentage of tank capacity'
      };
    }
    if (name.includes('absolute') || name.includes('level')) {
      return {
        category: 'Fuel System', 
        friendlyName: 'Fuel Level (Liters)',
        type: 'numeric',
        unit: 'liters',
        description: 'Actual fuel amount in the tank'
      };
    }
  }
  
  if (name.includes('door')) {
    const doorPosition = name.includes('driver') ? 'Driver' : 
                        name.includes('passenger') ? 'Passenger' :
                        name.includes('row2') ? 'Rear' : '';
    return {
      category: 'Vehicle Access',
      friendlyName: `${doorPosition} Door`.trim(),
      type: 'boolean',
      description: `Whether the ${doorPosition.toLowerCase()} door is open`
    };
  }
  
  if (name.includes('trunk') || name.includes('boot')) {
    return {
      category: 'Vehicle Access',
      friendlyName: 'Trunk/Boot',
      type: 'boolean', 
      description: 'Whether the trunk/boot is open'
    };
  }
  
  if (name.includes('tire') && name.includes('pressure')) {
    const position = name.includes('row1') && name.includes('left') ? 'Front Left' :
                    name.includes('row1') && name.includes('right') ? 'Front Right' :
                    name.includes('row2') && name.includes('left') ? 'Rear Left' :
                    name.includes('row2') && name.includes('right') ? 'Rear Right' : 'Tire';
    return {
      category: 'Vehicle Safety',
      friendlyName: `${position} Tire Pressure`,
      type: 'numeric',
      unit: 'kPa',
      description: `${position} tire pressure`
    };
  }
  
  if (name.includes('temperature')) {
    if (name.includes('exterior') || name.includes('ambient')) {
      return {
        category: 'Environment',
        friendlyName: 'Exterior Temperature',
        type: 'numeric',
        unit: '°C', 
        description: 'Outside air temperature'
      };
    }
    if (name.includes('engine') || name.includes('coolant') || name.includes('ect')) {
      return {
        category: 'Vehicle Safety',
        friendlyName: 'Engine Temperature',
        type: 'numeric',
        unit: '°C',
        description: 'Engine coolant temperature'
      };
    }
  }
  
  if (name.includes('location') || name.includes('latitude') || name.includes('longitude')) {
    const locType = name.includes('latitude') ? 'Latitude' :
                   name.includes('longitude') ? 'Longitude' :
                   name.includes('altitude') ? 'Altitude' : 'Location';
    return {
      category: 'Location',
      friendlyName: locType,
      type: 'numeric',
      unit: locType === 'Altitude' ? 'm' : 'degrees',
      description: `Current vehicle ${locType.toLowerCase()}`
    };
  }
  
  if (name.includes('odometer') || name.includes('distance') || name.includes('travelled')) {
    return {
      category: 'Vehicle Movement',
      friendlyName: 'Odometer Reading', 
      type: 'numeric',
      unit: 'km',
      description: 'Total distance traveled by the vehicle'
    };
  }
  
  // Default categorization
  return {
    category: 'Other Signals',
    friendlyName: signalName.replace(/([A-Z])/g, ' $1').trim(),
    type: isBoolean ? 'boolean' : 'numeric',
    description: `Vehicle signal: ${signalName}`
  };
};

// Generate trigger options based on signal type  
const getTriggerOptions = (signalType: 'boolean' | 'numeric') => {
  if (signalType === 'boolean') {
    return [
      { label: '🟢 Turns ON (becomes true)', value: 'turns_on' },
      { label: '🔴 Turns OFF (becomes false)', value: 'turns_off' }
    ];
  } else {
    return [
      { label: '📈 Exceeds value (greater than)', value: 'exceeds' },
      { label: '📉 Drops below value (less than)', value: 'drops_below' },
      { label: '🎯 Equals exact value', value: 'equals' },
      { label: '⬆️ Reaches or exceeds value (≥)', value: 'reaches_or_exceeds' },
      { label: '⬇️ Drops to or below value (≤)', value: 'drops_to_or_below' }
    ];
  }
};

// Build trigger condition from user-friendly inputs
const buildTriggerCondition = (signalType: 'boolean' | 'numeric', triggerType: string, triggerValue?: number) => {
  if (signalType === 'boolean') {
    return triggerType === 'turns_on' ? 'valueNumber = 1' : 'valueNumber = 0';
  } else {
    switch (triggerType) {
      case 'exceeds': return `valueNumber > ${triggerValue}`;
      case 'drops_below': return `valueNumber < ${triggerValue}`;
      case 'equals': return `valueNumber = ${triggerValue}`;
      case 'reaches_or_exceeds': return `valueNumber >= ${triggerValue}`;
      case 'drops_to_or_below': return `valueNumber <= ${triggerValue}`;
      default: return `valueNumber > ${triggerValue || 0}`;
    }
  }
};

export const webhooksApiAction = createAction({
  auth: dimoAuth,
  name: 'webhooks_api',
  displayName: 'DIMO Smart Notifications',
  description: 'Create smart notifications for your vehicle events with user-friendly setup',
  props: {
    operation: Property.StaticDropdown({
      displayName: 'What do you want to do?',
      description: 'Choose an operation',
      required: true,
      options: {
        options: [
          { label: '✨ Create Smart Notification', value: 'create' },
          { label: '📋 View My Notifications', value: 'list' },
          { label: '🔍 Get Available Signals', value: 'signals' },
          { label: '🗑️ Delete Notification', value: 'delete' },
          { label: '🔗 Subscribe Vehicle', value: 'subscribe' },
          { label: '📊 View Notification Details', value: 'details' },
        ],
      },
    }),
    
    // Dynamic signal category selection
    signalCategory: Property.Dropdown({
      displayName: 'What do you want to monitor?',
      description: 'Choose the type of vehicle data you want to track',
      required: false,
      refreshers: ['operation'],
      options: async ({ auth, operation }: any) => {
        if (operation !== 'create') {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select "Create Smart Notification" first'
          };
        }

        if (!auth?.developerJwt) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Developer JWT required in connection settings'
          };
        }

        try {
          // Fetch all available signals from DIMO
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://vehicle-events-api.dimo.zone/v1/webhooks/signals',
            headers: {
              'Authorization': `Bearer ${auth.developerJwt}`,
              'Content-Type': 'application/json',
            },
          });

          const signals = response.body.data || response.body || [];
          
          // Categorize signals dynamically
          const categories = new Set<string>();
          for (const signal of signals) {
            const signalName = signal.name || signal;
            const { category } = categorizeSignal(signalName);
            categories.add(category);
          }

          const options = Array.from(categories).sort().map(category => ({
            label: category,
            value: category
          }));

          return {
            disabled: false,
            options,
            placeholder: 'Select a category...'
          };

        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error fetching signals - check connection'
          };
        }
      },
    }),
    
    // Dynamic signal selection based on category
    signalName: Property.Dropdown({
      displayName: 'Specific Signal',
      description: 'Choose the exact data point to monitor',
      required: false,
      refreshers: ['signalCategory'],
      options: async ({ auth, signalCategory }: any) => {
        if (!signalCategory) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a category first'
          };
        }

        if (!auth?.developerJwt) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Developer JWT required'
          };
        }

        try {
          // Fetch all available signals from DIMO
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://vehicle-events-api.dimo.zone/v1/webhooks/signals',
            headers: {
              'Authorization': `Bearer ${auth.developerJwt}`,
              'Content-Type': 'application/json',
            },
          });

          const signals = response.body.data || response.body || [];
          
          // Filter and categorize signals for the selected category
          const categorySignals = [];
          for (const signal of signals) {
            const signalName = signal.name || signal;
            const signalInfo = categorizeSignal(signalName);
            
            if (signalInfo.category === signalCategory) {
              categorySignals.push({
                signalName,
                ...signalInfo
              });
            }
          }

          const options = categorySignals.map(signal => ({
            label: `${signal.friendlyName} ${signal.unit ? `(${signal.unit})` : ''} - ${signal.description}`,
            value: signal.signalName
          }));

          return {
            disabled: false,
            options,
            placeholder: 'Select a signal to monitor...'
          };

        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error fetching signals'
          };
        }
      },
    }),
    
    // Dynamic trigger condition builder
    triggerType: Property.Dropdown({
      displayName: 'When should this trigger?',
      description: 'Choose when you want to be notified',
      required: false,
      refreshers: ['signalName'],
      options: async ({ auth, signalName }: any) => {
        if (!signalName) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a signal first'
          };
        }

        // Determine signal type from the signal name
        const signalInfo = categorizeSignal(signalName as string);
        const options = getTriggerOptions(signalInfo.type);

        return {
          disabled: false,
          options,
          placeholder: 'Select trigger condition...'
        };
      },
    }),
    
    triggerValue: Property.Number({
      displayName: 'Trigger Value',
      description: 'Enter the value for your condition (not needed for ON/OFF signals)',
      required: false,
    }),
    
    // Simplified webhook setup
    webhookUrl: Property.ShortText({
      displayName: 'Notification URL',
      description: 'Where to send notifications (webhook URL, ngrok tunnel, etc.)',
      required: false,
    }),
    
    notificationName: Property.ShortText({
      displayName: 'Notification Name',
      description: 'Give your notification a friendly name (e.g., "Low Battery Alert")',
      required: false,
    }),
    
    vehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'Which vehicle to monitor (leave empty to monitor all your vehicles)',
      required: false,
    }),
    
    frequency: Property.StaticDropdown({
      displayName: 'How often to check?',
      description: 'Choose how frequently to check this condition',
      required: false,
      options: {
        options: [
          { label: '🚀 Real-time (instant notifications)', value: 'Realtime' },
          { label: '⏰ Hourly (once per hour)', value: 'Hourly' },
        ],
      },
      defaultValue: 'Realtime',
    }),
    
    subscribeAllVehicles: Property.Checkbox({
      displayName: 'Monitor all my vehicles',
      description: 'Apply this notification to all vehicles you have access to',
      required: false,
      defaultValue: false,
    }),
    
    // Other operation fields
    webhookId: Property.ShortText({
      displayName: 'Notification ID',
      description: 'ID of the notification to update/delete',
      required: false,
    }),
    
    subscribeVehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'Vehicle to add to this notification',
      required: false,
    }),
  },
  async run(context) {
    const { operation } = context.propsValue;
    
    if (!context.auth.developerJwt) {
      throw new Error('Developer JWT is required. Please configure it in your DIMO connection settings.');
    }

    const baseHeaders = {
      'Authorization': `Bearer ${context.auth.developerJwt}`,
      'Content-Type': 'application/json',
    };

    const baseUrl = 'https://vehicle-events-api.dimo.zone';

    try {
      switch (operation) {
        case 'signals': {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${baseUrl}/v1/webhooks/signals`,
            headers: baseHeaders,
          });

          const signals = response.body.data || response.body || [];
          
          // Categorize all signals dynamically
          const categorizedSignals: Record<string, any[]> = {};
          for (const signal of signals) {
            const signalName = signal.name || signal;
            const signalInfo = categorizeSignal(signalName);
            
            if (!categorizedSignals[signalInfo.category]) {
              categorizedSignals[signalInfo.category] = [];
            }
            
            categorizedSignals[signalInfo.category].push({
              originalName: signalName,
              friendlyName: signalInfo.friendlyName,
              type: signalInfo.type,
              unit: signalInfo.unit,
              description: signalInfo.description
            });
          }

          return {
            operation: 'signals',
            success: true,
            statusCode: response.status,
            totalSignals: Array.isArray(signals) ? signals.length : 0,
            categorizedSignals,
            message: `Found ${Array.isArray(signals) ? signals.length : 0} available signals, auto-categorized into ${Object.keys(categorizedSignals).length} categories.`,
          };
        }

        case 'create': {
          const { signalName, triggerType, triggerValue, webhookUrl, notificationName, vehicleTokenId, frequency, subscribeAllVehicles } = context.propsValue;
          
          if (!signalName || !triggerType || !webhookUrl) {
            throw new Error('Please select: Signal, Trigger Type, and Notification URL');
          }

          // Get signal info dynamically
          const signalInfo = categorizeSignal(signalName as string);

          // Validate trigger value for numeric signals
          if (signalInfo.type === 'numeric' && triggerValue === undefined) {
            throw new Error('Trigger value is required for numeric signals');
          }

          // Build trigger condition
          const triggerCondition = buildTriggerCondition(signalInfo.type, triggerType as string, triggerValue);

          // Create webhook
          const webhookData = {
            service: 'Telemetry',
            data: signalName,
            trigger: triggerCondition,
            setup: frequency || 'Realtime',
            description: notificationName || `${signalInfo.friendlyName} notification`,
            target_uri: webhookUrl,
            status: 'Active',
            verification_token: 'activepieces-smart-notification',
          };

          const createResponse = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${baseUrl}/v1/webhooks`,
            headers: baseHeaders,
            body: webhookData,
          });

          if (!createResponse.body.id) {
            throw new Error('Failed to create notification: No ID returned');
          }

          const webhookId = createResponse.body.id;
          let subscriptionResults = [];

          // Subscribe vehicles
          try {
            if (subscribeAllVehicles) {
              const subscribeAllResponse = await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `${baseUrl}/v1/webhooks/${webhookId}/subscribe/all`,
                headers: baseHeaders,
                body: {},
              });
              subscriptionResults.push({ type: 'all', success: true, data: subscribeAllResponse.body });
            } else if (vehicleTokenId) {
              const subscribeResponse = await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `${baseUrl}/v1/webhooks/${webhookId}/subscribe/${vehicleTokenId}`,
                headers: baseHeaders,
                body: {},
              });
              subscriptionResults.push({ type: 'specific', vehicleTokenId, success: true, data: subscribeResponse.body });
            }
          } catch (subscribeError: any) {
            subscriptionResults.push({ 
              type: subscribeAllVehicles ? 'all' : 'specific', 
              vehicleTokenId: vehicleTokenId || null,
              success: false, 
              error: subscribeError.message 
            });
          }

          return {
            operation: 'create',
            success: true,
            statusCode: createResponse.status,
            notificationId: webhookId,
            notificationName: notificationName || `${signalInfo.friendlyName} notification`,
            monitoring: {
              signal: signalInfo.friendlyName,
              originalSignalName: signalName,
              condition: `${signalInfo.friendlyName} ${triggerType.replace('_', ' ')}${triggerValue ? ` ${triggerValue}` : ''}`,
              technicalDetails: {
                signalName: signalName,
                triggerCondition: triggerCondition,
                frequency: frequency || 'Realtime'
              }
            },
            subscriptionResults,
            message: `✅ Smart notification created! You'll be notified when ${signalInfo.friendlyName} ${triggerType.replace('_', ' ')}${triggerValue ? ` ${triggerValue}` : ''}`,
          };
        }

        case 'list': {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${baseUrl}/v1/webhooks`,
            headers: baseHeaders,
          });

          const webhooks = response.body.data || response.body || [];

          // Make webhooks more user-friendly with dynamic categorization
          const friendlyWebhooks = Array.isArray(webhooks) ? webhooks.map((webhook: any) => {
            const signalInfo = categorizeSignal(webhook.data);
            
            return {
              id: webhook.id,
              name: webhook.description || `${signalInfo.friendlyName} notification`,
              category: signalInfo.category,
              signal: signalInfo.friendlyName,
              originalSignalName: webhook.data,
              condition: webhook.trigger,
              status: webhook.status,
              frequency: webhook.setup,
              webhookUrl: webhook.target_uri,
              createdAt: webhook.created_at,
              raw: webhook
            };
          }) : [];

          return {
            operation: 'list',
            success: true,
            statusCode: response.status,
            totalNotifications: friendlyWebhooks.length,
            notifications: friendlyWebhooks,
            message: `Found ${friendlyWebhooks.length} smart notification(s)`,
          };
        }

        case 'details': {
          const { webhookId } = context.propsValue;
          
          if (!webhookId) {
            throw new Error('Notification ID is required');
          }

          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${baseUrl}/v1/webhooks/${webhookId}`,
            headers: baseHeaders,
          });

          return {
            operation: 'details',
            success: true,
            statusCode: response.status,
            notificationId: webhookId,
            details: response.body,
            message: `Retrieved details for notification ${webhookId}`,
          };
        }

        case 'subscribe': {
          const { webhookId, subscribeVehicleTokenId } = context.propsValue;
          
          if (!webhookId || !subscribeVehicleTokenId) {
            throw new Error('Notification ID and Vehicle Token ID are required');
          }

          const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${baseUrl}/v1/webhooks/${webhookId}/subscribe/${subscribeVehicleTokenId}`,
            headers: baseHeaders,
            body: {},
          });

          return {
            operation: 'subscribe',
            success: true,
            statusCode: response.status,
            notificationId: webhookId,
            vehicleTokenId: subscribeVehicleTokenId,
            message: `✅ Vehicle ${subscribeVehicleTokenId} subscribed to notification ${webhookId}`,
          };
        }

        case 'delete': {
          const { webhookId } = context.propsValue;
          
          if (!webhookId) {
            throw new Error('Notification ID is required');
          }

          const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${baseUrl}/v1/webhooks/${webhookId}`,
            headers: baseHeaders,
          });

          return {
            operation: 'delete',
            success: true,
            statusCode: response.status,
            notificationId: webhookId,
            message: `✅ Notification ${webhookId} deleted successfully`,
          };
        }

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed: Invalid Developer JWT. Please check your DIMO connection settings.');
      }
      if (error.response?.status === 400) {
        throw new Error(`Invalid request: ${error.response?.body?.message || error.message}. Please check your settings and try again.`);
      }
      if (error.response?.status === 404) {
        throw new Error('Resource not found. Please check the notification ID or vehicle token ID.');
      }
      throw new Error(`Operation failed: ${error.message}`);
    }
  },
});