import { prisma } from '../lib/prisma.js';
import { CreateClientInput } from '../validators/clientValidator.js';

export async function listClients() {
  return prisma.client.findMany({
    include: {
      _count: {
        select: { projects: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createClient(input: CreateClientInput) {
  return prisma.client.create({
    data: input,
  });
}

export async function listDevelopers() {
  return prisma.user.findMany({
    where: { role: 'DEVELOPER' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  });
}
