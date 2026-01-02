
'use server';

/**
 * @fileOverview Data fetching functions for services, products, and pricing.
 * These functions use the Firebase Admin SDK to fetch data from Firestore for use in server-side logic like Genkit flows.
 */

import { firestore } from '@/firebase/admin';

// A generic function to fetch all documents from a collection.
async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const snapshot = await firestore.collection(collectionName).get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    // In a real-world scenario, you might want more robust error handling.
    // For now, we return an empty array to prevent crashes.
    return [];
  }
}

/**
 * Fetches all services from the 'services' collection in Firestore.
 */
export async function getServices(): Promise<any[]> {
  return fetchCollection('services');
}

/**
 * Fetches all products from the 'products' collection in Firestore.
 */
export async function getProducts(): Promise<any[]> {
  return fetchCollection('products');
}

/**
 * Fetches all pricing packages from the 'pricing' collection in Firestore.
 */
export async function getPricingPackages(): Promise<any[]> {
  return fetchCollection('pricing');
}
