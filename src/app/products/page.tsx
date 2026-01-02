
'use client';

import * as React from 'react';
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
              products.map((product) => {
                const image = product.image_url ? { imageUrl: product.image_url, imageHint: product.name } : getProductImage(product);
                return (
                  <Card key={product.id} className="text-left overflow-hidden flex flex-col group transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                    <div className="relative h-56 w-full">
                      {image ? (
                        <Image src={image.imageUrl} alt={product.name} fill style={{ objectFit: 'cover' }} data-ai-hint={image.imageHint} />
                      ) : (
                        <div className="bg-muted w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingBag className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors">{product.name}</CardTitle>
                      <Badge variant={product.status === 'In Stock' ? 'secondary' : product.status === 'Low Stock' ? 'destructive' : 'outline'}>
                        {product.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex-grow mt-auto">
                      <p className="text-2xl font-bold text-accent mb-4">${product.price.toFixed(2)}</p>
                      <Button className="w-full" onClick={async () => {
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
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full h-40 flex flex-col items-center justify-center text-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Products Found</h3>
                <p className="text-muted-foreground">Check back later for our product catalog.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
