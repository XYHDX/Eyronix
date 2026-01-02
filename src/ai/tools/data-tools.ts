
'use server';
/**
 * @fileOverview Defines Genkit tools for accessing business data from Firestore.
 * These tools allow the AI to fetch information about services, products, and pricing packages.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getServices, getProducts, getPricingPackages } from '@/services/data';

export const servicesTool = ai.defineTool(
  {
    name: 'getServices',
    description: 'Get a list of all available services offered by the company.',
    inputSchema: z.object({}), // No input needed
    outputSchema: z.array(z.any()),
  },
  async () => {
    return await getServices();
  }
);

export const productsTool = ai.defineTool(
  {
    name: 'getProducts',
    description: 'Get a list of all available products for sale, including their price and stock status.',
    inputSchema: z.object({}), // No input needed
    outputSchema: z.array(z.any()),
  },
  async () => {
    return await getProducts();
  }
);

export const pricingTool = ai.defineTool(
  {
    name: 'getPricingPackages',
    description: 'Get a list of all available pricing packages, including their price and features.',
    inputSchema: z.object({}), // No input needed
    outputSchema: z.array(z.any()),
  },
  async () => {
    return await getPricingPackages();
  }
);
