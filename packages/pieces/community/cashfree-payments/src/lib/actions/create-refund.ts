import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createRefund = createAction({
  name: 'create-refund',
  displayName: 'Create Refund',
  description: 'Initiate a refund for a Cashfree order. Refunds can only be initiated within six months of the original transaction.',
  requireAuth: true,
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Choose the environment for API calls',
      required: true,
      defaultValue: 'sandbox',
      options: {
        disabled: false,
        options: [
          {
            label: 'Sandbox',
            value: 'sandbox',
          },
          {
            label: 'Production',
            value: 'production',
          },
        ],
      },
    }),
    
    // Required Fields
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The ID which uniquely identifies your order',
      required: true,
    }),
    refundAmount: Property.Number({
      displayName: 'Refund Amount',
      description: 'Amount to be refunded. Should be lesser than or equal to the transaction amount. (Decimals allowed)',
      required: true,
    }),
    refundId: Property.ShortText({
      displayName: 'Refund ID',
      description: 'An unique ID to associate the refund with. Provide alphanumeric values (3-40 characters)',
      required: true,
    }),
    
    // Optional Fields
    refundNote: Property.ShortText({
      displayName: 'Refund Note',
      description: 'A refund note for your reference (3-100 characters)',
      required: false,
    }),
    refundSpeed: Property.StaticDropdown({
      displayName: 'Refund Speed',
      description: 'Speed at which the refund is processed',
      required: false,
      defaultValue: 'STANDARD',
      options: {
        disabled: false,
        options: [
          {
            label: 'Standard',
            value: 'STANDARD',
          },
          {
            label: 'Instant',
            value: 'INSTANT',
          },
        ],
      },
    }),
    
    // Refund Splits
    refundSplits: Property.LongText({
      displayName: 'Refund Splits',
      description: 'JSON array for vendor splits. Example: [{"vendor_id":"vendor1","amount":100},{"vendor_id":"vendor2","percentage":25}]',
      required: false,
    }),
    
    // Custom Tags
    tags: Property.LongText({
      displayName: 'Custom Tags',
      description: 'Custom Tags in JSON format {"key":"value"}. Maximum 10 tags allowed. Example: {"refund_reason":"customer_request","processed_by":"admin"}',
      required: false,
    }),
    
    // Request Headers
    requestId: Property.ShortText({
      displayName: 'Request ID',
      description: 'Request ID for the API call. Can be used to resolve tech issues',
      required: false,
    }),
    idempotencyKey: Property.ShortText({
      displayName: 'Idempotency Key',
      description: 'UUID format idempotency key to avoid duplicate actions if request fails or times out',
      required: false,
    }),
  },
  
  async run(context) {
    // Get authentication values from piece-level auth
    const { authType, clientId, clientSecret, bearerToken } = context.auth as {
      authType: string;
      clientId?: string;
      clientSecret?: string;
      bearerToken?: string;
    };
    
    // Validate authentication based on type
    if (authType === 'client_credentials' && (!clientId || !clientSecret)) {
      return {
        success: false,
        error: 'Client ID and Client Secret are required when using client credentials authentication',
        message: 'Please provide both Client ID and Client Secret',
      };
    }
    
    if (authType === 'bearer_token' && !bearerToken) {
      return {
        success: false,
        error: 'Bearer Token is required when using bearer token authentication',
        message: 'Please provide a valid Bearer Token',
      };
    }

    // Get action-specific values from props
    const {
      environment,
      orderId,
      refundAmount,
      refundId,
      refundNote,
      refundSpeed,
      refundSplits,
      tags,
      requestId,
      idempotencyKey,
    } = context.propsValue;

    // Validate refund ID format and length
    if (refundId.length < 3 || refundId.length > 40) {
      return {
        success: false,
        error: 'Invalid refund ID length',
        message: 'Refund ID must be between 3 and 40 characters',
      };
    }

    // Validate refund note length if provided
    if (refundNote && (refundNote.length < 3 || refundNote.length > 100)) {
      return {
        success: false,
        error: 'Invalid refund note length',
        message: 'Refund note must be between 3 and 100 characters',
      };
    }

    // Validate refund amount
    if (refundAmount <= 0) {
      return {
        success: false,
        error: 'Invalid refund amount',
        message: 'Refund amount must be greater than 0',
      };
    }

    // Determine the base URL based on environment
    const baseUrl = environment === 'production' 
      ? `https://api.cashfree.com/pg/orders/${orderId}/refunds`
      : `https://sandbox.cashfree.com/pg/orders/${orderId}/refunds`;

    // Parse refund splits if provided
    let parsedRefundSplits;
    if (refundSplits) {
      try {
        parsedRefundSplits = JSON.parse(refundSplits);
        
        // Validate refund splits structure
        if (!Array.isArray(parsedRefundSplits)) {
          return {
            success: false,
            error: 'Invalid refund splits format',
            message: 'Refund splits must be a JSON array',
          };
        }
        
        // Validate each split entry
        for (const split of parsedRefundSplits) {
          if (!split.vendor_id) {
            return {
              success: false,
              error: 'Invalid refund split entry',
              message: 'Each refund split must have a vendor_id',
            };
          }
          
          if (!split.amount && !split.percentage) {
            return {
              success: false,
              error: 'Invalid refund split entry',
              message: 'Each refund split must have either amount or percentage',
            };
          }
        }
      } catch (error) {
        return {
          success: false,
          error: 'Invalid JSON format for refund splits',
          message: 'Refund splits must be valid JSON array. Example: [{"vendor_id":"vendor1","amount":100}]',
        };
      }
    }

    // Parse custom tags if provided
    let parsedTags;
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
        
        // Validate tags structure
        if (typeof parsedTags !== 'object' || Array.isArray(parsedTags)) {
          return {
            success: false,
            error: 'Invalid tags format',
            message: 'Tags must be a JSON object',
          };
        }
        
        // Validate maximum 10 tags
        if (Object.keys(parsedTags).length > 10) {
          return {
            success: false,
            error: 'Too many tags',
            message: 'Maximum 10 tags are allowed',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: 'Invalid JSON format for tags',
          message: 'Tags must be valid JSON format. Example: {"refund_reason":"customer_request","processed_by":"admin"}',
        };
      }
    }

    // Prepare the request body
    const requestBody: any = {
      refund_amount: refundAmount,
      refund_id: refundId,
    };

    // Add optional fields
    if (refundNote) requestBody.refund_note = refundNote;
    if (refundSpeed) requestBody.refund_speed = refundSpeed;
    if (parsedRefundSplits) requestBody.refund_splits = parsedRefundSplits;
    if (parsedTags) requestBody.tags = parsedTags;

    // Build headers based on authentication type
    const headers: any = {
      'x-api-version': '2025-01-01',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (authType === 'client_credentials') {
      headers['x-client-id'] = clientId;
      headers['x-client-secret'] = clientSecret;
    } else if (authType === 'bearer_token') {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    // Add optional headers
    if (requestId) headers['x-request-id'] = requestId;
    if (idempotencyKey) headers['x-idempotency-key'] = idempotencyKey;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: baseUrl,
        headers: headers,
        body: requestBody,
      });

      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: response.body,
          message: 'Refund initiated successfully',
          cf_refund_id: response.body?.cf_refund_id,
          refund_id: response.body?.refund_id,
          order_id: response.body?.order_id,
          refund_status: response.body?.refund_status,
          refund_amount: response.body?.refund_amount,
          refund_note: response.body?.refund_note,
          refund_speed: response.body?.refund_speed,
          status_description: response.body?.status_description,
          metadata: response.body?.metadata,
          refund_splits: response.body?.refund_splits,
          refund_arn: response.body?.refund_arn,
          refund_charge: response.body?.refund_charge,
          refund_mode: response.body?.refund_mode,
          created_at: response.body?.created_at,
          processed_at: response.body?.processed_at,
        };
      } else {
        return {
          success: false,
          error: response.body,
          message: 'Failed to create refund',
          status: response.status,
        };
      }
    } catch (error) {
      console.error('Error creating Cashfree refund:', error);
      return {
        success: false,
        error: error,
        message: 'An error occurred while creating the refund',
      };
    }
  },
});
