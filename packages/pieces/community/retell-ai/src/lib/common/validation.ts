import { z } from 'zod';

export const phoneNumberSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g., +12137771234)');

export const agentIdSchema = z
  .string()
  .min(1, 'Agent ID is required')
  .max(100, 'Agent ID is too long');

export const callIdSchema = z
  .string()
  .min(1, 'Call ID is required')
  .max(100, 'Call ID is too long');

export const voiceIdSchema = z
  .string()
  .min(1, 'Voice ID is required')
  .max(100, 'Voice ID is too long');

export const metadataSchema = z
  .record(z.string(), z.any())
  .optional();

export const dynamicVariablesSchema = z
  .record(z.string(), z.any())
  .optional();

export const sipHeadersSchema = z
  .record(z.string(), z.string())
  .optional();

export const makePhoneCallSchema = z.object({
  from_number: phoneNumberSchema,
  to_number: phoneNumberSchema,
  agent_id: agentIdSchema,
  metadata: metadataSchema,
  retell_llm_dynamic_variables: dynamicVariablesSchema,
  custom_sip_headers: sipHeadersSchema,
  opt_out_sensitive_data_storage: z.boolean().optional(),
  opt_in_signed_url: z.boolean().optional(),
});

export const createPhoneNumberSchema = z.object({
  phone_number: phoneNumberSchema,
  agent_id: agentIdSchema,
  metadata: metadataSchema,
});

export const getCallSchema = z.object({
  call_id: callIdSchema,
});

export const getPhoneNumberSchema = z.object({
  phone_number: phoneNumberSchema,
});

export const getVoiceSchema = z.object({
  voice_id: voiceIdSchema,
});

export const getAgentSchema = z.object({
  agent_id: agentIdSchema,
});

export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    throw error;
  }
};

export const sanitizePhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
};

export const validateRetellAiResponse = (response: any): boolean => {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  if (response.error) {
    throw new Error(`Retell AI API error: ${response.error}`);
  }
  
  return true;
};
