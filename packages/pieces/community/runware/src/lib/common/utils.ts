import * as z from 'zod/mini';

export const runwareUtils = {
	dimensionsSchema: z.number().check(z.minimum(128), z.maximum(2048)),
	modelSchema: z.string(),
	stepsSchema: z.number().check(z.minimum(1), z.maximum(100)),
	CFGScaleSchema: z.number().check(z.minimum(1), z.maximum(30)),
	schedulerSchema: z.string(),
	promptSchema: z.string().check(z.minLength(2), z.maxLength(3000)),
	outputQualitySchema: z.number().check(z.minimum(20), z.maximum(99)),
};
