'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';

import Header from '@/components/header';
import Footer from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';

type Product = {
  id: string;
  name: string;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stock: number;
  image_url?: string | null;
  image_id?: string | null;
};

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const getProductImage = (product: Product): ImagePlaceholder | undefined => {
    if (!product.image_id) return undefined;
    return PlaceHolderImages.find((img) => img.id === product.image_id);
  };

  return (
    <>
      <Header />
      <div className="bg-background">
        <main className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 font-headline">
              Our Products
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Browse our collection of high-quality security hardware.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="text-left overflow-hidden">
                  <Skeleton className="h-56 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-5 w-20 rounded-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-1/3" />
                  </CardContent>
                </Card>
              ))
            ) : products && products.length > 0 ? (
              products.filter(p => {
                const name = p.name.toLowerCase();
                // Filter Logic: Only show Dahua/WizSense/TiOC or assume everything else is legacy
                // For this strict transformation, we hide anything that DOESN'T look like a camera/recorder if we can't be sure, 
                // but simpler is to just filter for our target keywords OR since the prompt says "Identify all products... NOT brand Dahua",
                // we'll assume the current mock data might not have "Dahua" in the name. 
                // Let's being aggressive: Show if name contains "Camera", "NVR", "XVR", "Dahua", "WizSense".
                return name.includes('camera') || name.includes('nvr') || name.includes('dvr') || name.includes('xvr') || name.includes('kit') || name.includes('dahua');
              }).map((product) => {
                const image = product.image_url ? { imageUrl: product.image_url, imageHint: product.name } : getProductImage(product);

                // Description Rewrite Logic
                let customDescription = "High-performance security solution.";
                if (product.name.toLowerCase().includes('wizsense') || product.name.toLowerCase().includes('tioc')) {
                  customDescription = "AI-Powered Perimeter Protection: Distinguishes between humans and vehicles to eliminate false alarms. Ideal for securing government compounds and high-value assets.";
                } else if (product.name.toLowerCase().includes('4k')) {
                  customDescription = "Ultra-High Definition Visual Sensor: Provides crystal clear evidence for critical infrastructure monitoring.";
                } else if (product.name.toLowerCase().includes('nvr') || product.name.toLowerCase().includes('dvr')) {
                  customDescription = "Centralized Data Processing Unit: Enterprise-grade recording and analytics server.";
                }

                // Agency Pricing Logic
                const isAgencyItem = product.price > 200;

                return (
                  <Card key={product.id} className="text-left overflow-hidden flex flex-col group transform transition-transform duration-300 hover:scale-105 hover:shadow-xl border-slate-200 hover:border-dahua-red/50">
                    <div className="relative h-56 w-full bg-slate-100">
                      {image ? (
                        <Image src={image.imageUrl} alt={product.name} fill style={{ objectFit: 'contain', padding: '1rem' }} data-ai-hint={image.imageHint} />
                      ) : (
                        <div className="bg-muted w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingBag className="w-16 h-16" />
                        </div>
                      )}

                      {/* Badge for AI items */}
                      {(product.name.toLowerCase().includes('wizsense') || product.name.toLowerCase().includes('ai')) && (
                        <div className="absolute top-2 right-2 bg-dahua-red text-white text-xs font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                          AI-Powered
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg font-headline group-hover:text-dahua-red transition-colors line-clamp-2">{product.name.replace(/Camera/i, "Visual Sensor")}</CardTitle>
                      <Badge variant={product.status === 'In Stock' ? 'secondary' : product.status === 'Low Stock' ? 'destructive' : 'outline'}>
                        {product.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex-grow mt-auto flex flex-col gap-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {customDescription}
                      </p>

                      <div className="mt-auto pt-4 border-t">
                        {isAgencyItem ? (
                          <div className="space-y-2">
                            <p className="text-lg font-bold text-dahua-red">Agency Pricing</p>
                            <Button className="w-full bg-slate-900 hover:bg-slate-800" onClick={() => {
                              // Redirect to survey or open dialog
                              const surveySection = document.getElementById('survey');
                              if (surveySection) {
                                surveySection.scrollIntoView({ behavior: 'smooth' });
                                toast({ title: "Request Pricing", description: "Please fill out the form below for an official agency quote." });
                              } else {
                                // Fallback if on a page without the survey immediately visible, or just route to contact
                                window.location.href = "/#survey";
                              }
                            }}>
                              Request Quote
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-2xl font-bold text-slate-900">${product.price.toFixed(2)}</p>
                            <Button className="w-full bg-dahua-red hover:bg-red-700" onClick={async () => {
                              if (product.stock > 0) {
                                try {
                                  const { data: { user } } = await supabase.auth.getUser();
                                  const { error } = await supabase.from('sales').insert([{
                                    user_id: user?.id || null,
                                    item_details: product,
                                    type: 'product',
                                    amount: product.price,
                                    status: 'Pending Info' // Initial status requiring user input
                                  }]);

                                  if (error) throw error;

                                  // Decrement Stock
                                  await supabase.from('products').update({ stock: product.stock - 1 }).eq('id', product.id);

                                  toast({ title: 'Added to Cart', description: `Please go to My Orders to complete your purchase.` });
                                  // Optimistically update UI
                                  setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: p.stock - 1 } : p));

                                } catch (e) {
                                  console.error("Order failed", e);
                                  toast({ variant: 'destructive', title: 'Order Failed', description: 'Could not place order.' });
                                }
                              } else {
                                toast({ variant: 'destructive', title: 'Out of Stock', description: 'This item is currently unavailable.' });
                              }
                            }} disabled={product.stock === 0}>
                              {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full h-40 flex flex-col items-center justify-center text-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Strategic Solutions Found</h3>
                <p className="text-muted-foreground">Please contact us for custom infrastructure projects.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
