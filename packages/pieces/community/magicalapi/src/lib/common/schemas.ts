import z from 'zod';

export const parseResume = { url: z.string().url() };

export const reviewResume = { url: z.string().url() };

export const getProfileData = { profile_name: z.string().min(2).max(100) };

export const getCompanyData = z
  .object({
    company_name: z.string().min(2).optional(),
    company_username: z.string().min(2).optional(),
    company_website: z.string().url().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.company_name && !val.company_username && !val.company_website) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Please provide at least one of the fields: Company Name, Company Username, or Company Website.',
      });
    }
  });

export const scoreResume = {
  url: z.string().url(),
  job_description: z.string(),
};

export const checkResult = {
    request_id: z.string(),
}
