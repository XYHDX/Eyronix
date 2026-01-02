'use server';

/**
 * @fileOverview Data fetching functions for services, products, and pricing.
 * These functions use the Supabase SDK to fetch data.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_EYRONIX_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_EYRONIX_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// A generic function to fetch all documents from a table.
async function fetchCollection<T>(tableName: string): Promise<T[]> {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
    return data as T[];
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return [];
  }
}

/**
 * Fetches all services from the 'services' table.
 */
export async function getServices(): Promise<any[]> {
  return fetchCollection('services');
}

/**
 * Fetches all products from the 'products' table.
 */
export async function getProducts(): Promise<any[]> {
  return fetchCollection('products');
}

/**
 * Fetches all pricing packages from the 'pricing' table.
 */
export async function getPricingPackages(): Promise<any[]> {
  return fetchCollection('pricing');
}
