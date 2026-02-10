'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingBag, Sparkles } from 'lucide-react';

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
              products.map((product) => {
                let solutionName = product.name;
                const lowerName = product.name.toLowerCase();
                let customDescription = product.description || "High-performance security solution.";

                // 1. Rename product.name based on keywords & 2. Update customDescription logic
                if (lowerName.includes('camera') || lowerName.includes('4mp')) {
                  solutionName = "Solar-Powered Border Monitoring System";
                  customDescription = "Zero Electricity Required. Deploy military-grade surveillance in remote areas with integrated solar and 4G connectivity.";
                } else if (lowerName.includes('nvr') || lowerName.includes('recorder') || lowerName.includes('dvr') || lowerName.includes('xvr')) {
                  solutionName = "Centralized Data Processing Unit";
                  customDescription = "Enterprise-grade video retention and AI processing hub for municipal-scale deployments.";
                } else if (lowerName.includes('traffic') || lowerName.includes('anpr') || lowerName.includes('kit')) {
                  solutionName = "Traffic Management & Automated Fine Collection System (ANPR)";
                  customDescription = "Automated license plate recognition and violation processing system for smart city traffic enforcement.";
                }

                // AI Badge Logic
                const isAI = lowerName.includes('wizsense') || lowerName.includes('tioc') || lowerName.includes('ai');
                const isAgencyItem = product.price > 200;

                // Determine image source
                const imageSource = product.image_url || (getProductImage(product)?.imageUrl);
                const imageAlt = solutionName;

                return (
                  <Card key={product.id} className="text-left overflow-hidden flex flex-col group transform transition-transform duration-300 hover:scale-105 hover:shadow-xl border-slate-200 hover:border-dahua-red/50">
                    <div className="relative h-64 w-full bg-white p-4">
                      {isAI && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="secondary" className="bg-dahua-red text-white flex gap-1 items-center">
                            <Sparkles className="w-3 h-3" /> AI-Powered
                          </Badge>
                        </div>
                      )}
                      {imageSource ? (
                        <Image
                          src={imageSource}
                          alt={imageAlt}
                          fill
                          style={{ objectFit: 'contain' }}
                          className="transition-opacity duration-300 group-hover:opacity-90"
                        />
                      ) : (
                        <div className="bg-muted w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingBag className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2 h-14 text-lg font-bold font-headline">{solutionName}</CardTitle>
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
                              const element = document.getElementById('survey');
                              if (element) element.scrollIntoView({ behavior: 'smooth' });
                              toast({
                                title: "Strategic Request Initiated",
                                description: "Please complete the agency form below."
                              });
                            }}>
                              Request Agency Pricing
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-2xl font-bold text-slate-900">${product.price.toFixed(2)}</p>
                            <Button className="w-full bg-dahua-red hover:bg-red-700" disabled={product.stock === 0} onClick={async () => {
                              if (product.stock > 0) {
                                try {
                                  // Optimistic UI update - functionality for demo only
                                  toast({ title: 'Added to Deployment List', description: `${solutionName} added.` });
                                  setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: p.stock - 1 } : p));
                                } catch (e) {
                                  console.error("Order failed", e);
                                  toast({ variant: 'destructive', title: 'Order Failed', description: 'Could not place order.' });
                                }
                              } else {
                                toast({ variant: 'destructive', title: 'Out of Stock', description: 'This item is currently unavailable.' });
                              }
                            }}>
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
        </main >
      </div >
      <Footer />
    </>
  );
}
