import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(2, 'Client name is required'),
  company: z.string().min(2, 'Company name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
