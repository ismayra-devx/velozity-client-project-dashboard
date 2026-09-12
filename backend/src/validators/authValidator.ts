import { z } from 'zod';

export const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'mail.com',
  'gmx.com',
]);

export function isPersonalEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return Boolean(domain && PERSONAL_EMAIL_DOMAINS.has(domain));
}

export const loginSchema = z.object({
  email: z
    .string()
    .email('Valid email is required')
    .refine((val) => !isPersonalEmail(val), {
      message: 'Personal email addresses (e.g. @gmail, @yahoo, @outlook) are not permitted. Please use your corporate agency work email.',
    }),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .email('Valid email is required')
    .refine((val) => !isPersonalEmail(val), {
      message: 'Personal email addresses are not permitted for agency accounts.',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

