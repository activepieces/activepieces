import { z } from "zod";
export declare const propsValidation: {
    validateZod<T extends Record<string, unknown>>(props: T, schema: Partial<Record<keyof T, z.ZodTypeAny>>): Promise<void>;
};
