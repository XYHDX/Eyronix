
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Camera,
  Car,
  Wrench,
  CheckCircle,
  ShieldCheck,
  Zap,
  BrainCircuit,
  LucideProps,
  ShoppingBag,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';

import Header from '@/components/header';
import Footer from '@/components/footer';
import Chatbot from '@/components/chatbot';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';
import { analyzeImage } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { mockDb } from '@/lib/mock-db';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

const iconMap: { [key: string]: React.ComponentType<LucideProps> } = {
  Camera,
  Car,
  Wrench,
};

type Service = {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl?: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  imageUrl?: string | null;
  imageId?: string | null;
};

type PricingPackage = {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular: boolean;
};

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  phone: z.string().min(8, { message: 'Please enter a valid phone number.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }).max(500),
});

const defaultAiImage = PlaceHolderImages.find(img => img.id === 'ai-motion-detection');


export default function Home() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultAiImage?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [forceReflow, setForceReflow] = useState(false);

  const firestore = useFirestore();
  const servicesCollection = 'services';
  const productsCollection = 'products';
  const pricingCollection = 'pricing';

  const { data: services, isLoading: servicesLoading } = useCollection<Service>(servicesCollection);
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsCollection);
  const { data: pricingPackages, isLoading: pricingLoading } = useCollection<PricingPackage>(pricingCollection);

  const featuredProducts = useMemo(() => products?.slice(0, 4) || [], [products]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult('');
    }
  };

  async function onSurveySubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Database service is not available.',
      });
      return;
    }



    const dataToSave = {
      ...values,
      status: 'New',
      createdAt: serverTimestamp(),
    };

    const requestsCollectionRef = collection(firestore, 'survey-requests');
    addDoc(requestsCollectionRef, dataToSave)
      .then(() => {
        toast({
          title: 'Request Sent!',
          description: "We've received your request and will contact you shortly.",
        });
        form.reset();
      })
      .catch((error) => {
        console.error("Survey submission error:", error);
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: requestsCollectionRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
          })
        );
      })
      .finally(() => {

      });
  }

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  async function handleAiAnalysis() {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No Image Selected',
        description: 'Please upload an image to analyze.',
      });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult('');

    try {
      const dataUri = await fileToDataUri(selectedFile);
      const result = await analyzeImage(dataUri);
      setAnalysisResult(result.alertMessage);

      // Auto-open chatbot with context
      window.dispatchEvent(new CustomEvent('open-chatbot', {
        detail: { message: `I see the AI detected: "${result.alertMessage}". Would you like to discuss specific security solutions for this?` }
      }));
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisResult('Failed to convert or analyze the image.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      setForceReflow(scrollRef.current.offsetWidth > 0);
    }
  }, []);

  const getProductImage = (product: Product): ImagePlaceholder | undefined => {
    if (!product.imageId) return undefined;
    return PlaceHolderImages.find((img) => img.id === product.imageId);
  }

  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

  return (
    <>
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section id="home" className="relative text-center py-16 md:py-28 bg-card">
          <div className="absolute inset-0">
            {heroImage && <Image src={heroImage.imageUrl} alt={heroImage.description} fill style={{ objectFit: 'cover' }} className="opacity-10" data-ai-hint={heroImage.imageHint} priority />}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background"></div>
          </div>
          <div className="container mx-auto relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 font-headline leading-tight">
              Modern Security,
              <span className="block text-primary mt-2">Unmatched Clarity.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
              Eyronix Syria delivers cutting-edge security solutions tailored for your peace of mind.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => document.getElementById('survey')?.scrollIntoView({ behavior: 'smooth' })}>
                <ShieldCheck className="mr-2 h-5 w-5" />
                Request a Free Survey
              </Button>
              <Button size="lg" asChild variant="secondary">
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  View Products
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 font-headline">Our Expertise</h2>
            <p className="max-w-2xl mx-auto text-muted-foreground mb-12">
              From installation to maintenance, we provide comprehensive security services.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {servicesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="text-left overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                      <Skeleton className="h-8 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))
              ) : services?.map((service) => {
                const Icon = iconMap[service.icon];
                return (
                  <Card key={service.id} className="text-left overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                    {service.imageUrl && (
                      <div className="relative h-48 w-full">
                        <Image src={service.imageUrl} alt={service.description} fill style={{ objectFit: 'cover' }} />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        {Icon && <Icon className="h-8 w-8 text-primary" />}
                        <span className="text-2xl font-headline">{service.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{service.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section id="products" className="py-16 md:py-24 bg-card">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 font-headline">Featured Products</h2>
            <p className="max-w-2xl mx-auto text-muted-foreground mb-12">
              High-quality security hardware to protect what matters most.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {productsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="text-left overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-6 w-1/4" />
                    </CardContent>
                  </Card>
                ))
              ) : featuredProducts.map((product) => {
                const image = product.imageUrl ? { imageUrl: product.imageUrl, imageHint: product.name } : getProductImage(product);
                return (
                  <Card key={product.id} className="text-left overflow-hidden flex flex-col">
                    <div className="relative h-48 w-full">
                      {image ? (
                        <Image src={image.imageUrl} alt={product.name} width={400} height={400} className="object-cover w-full h-full" data-ai-hint={image.imageHint} />
                      ) : (
                        <div className="bg-muted w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingBag className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl font-headline">{product.name}</CardTitle>
                      <Badge variant={product.status === 'In Stock' ? 'secondary' : product.status === 'Low Stock' ? 'destructive' : 'outline'}>
                        {product.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-2xl font-bold text-accent mb-4">${product.price.toFixed(2)}</p>
                      <Button className="w-full" size="sm" onClick={() => {
                        if (product.stock > 0) {
                          mockDb.addOrder(product, 'product');
                          toast({ title: 'Order Placed!', description: `You bought ${product.name}.` });
                        } else {
                          toast({ variant: 'destructive', title: 'Out of Stock', description: 'This item is currently unavailable.' });
                        }
                      }} disabled={product.stock === 0}>
                        {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <div className="mt-12">
              <Button asChild size="lg">
                <Link href="/products">
                  View All Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* AI Motion Detection Section */}
        <section id="ai-feature" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 font-headline">Interactive AI Analysis</h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Test our AI's capabilities. Upload any image, and our advanced system will instantly analyze it to detect human or vehicle presence. Experience firsthand how intelligent analysis can distinguish significant events from background noise.
                </p>
                <div className="flex gap-4">
                  <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Image
                  </Button>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <Button onClick={handleAiAnalysis} disabled={isAnalyzing || !selectedFile}>
                    <BrainCircuit className="mr-2 h-5 w-5" />
                    {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                  </Button>
                </div>
                {analysisResult && (
                  <Alert className="mt-6">
                    <Zap className="h-4 w-4" />
                    <AlertTitle>Analysis Complete</AlertTitle>
                    <AlertDescription>
                      {analysisResult}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl bg-muted">
                {previewUrl ? (
                  <Image src={previewUrl} alt="AI analysis preview" fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="w-16 h-16" />
                    <p className="mt-2">Upload an image to begin</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-bold text-lg">LIVE DEMO: SCENE ANALYSIS</p>
                  <p className="text-sm opacity-80">Upload any image to test</p>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 bg-card">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 font-headline">Security Packages</h2>
            <p className="max-w-2xl mx-auto text-muted-foreground mb-12">
              Choose the package that fits your needs. No hidden fees.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {pricingLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-8 w-1/2" />
                      <Skeleton className="h-10 w-1/3" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-3/4" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))
              ) : pricingPackages?.sort((a, b) => a.price - b.price).map((pkg) => (
                <Card key={pkg.id} className={`text-left ${pkg.popular ? 'border-primary border-2 shadow-primary/20 shadow-lg -translate-y-4' : ''}`}>
                  {pkg.popular && (
                    <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-semibold rounded-t-lg -mt-px">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl font-headline">{pkg.name}</CardTitle>
                    <CardDescription className="text-4xl font-bold text-foreground">{pkg.price > 0 ? `$${pkg.price}` : 'Custom'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {pkg.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full" variant={pkg.popular ? 'default' : 'outline'}>
                            {pkg.price > 0 ? 'View Details & Buy' : 'Contact Us'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>{pkg.name} Package Specs</DialogTitle>
                            <DialogDescription>
                              Detailed technical specifications for this security setup.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <span className="font-bold col-span-4">Camera Specifications</span>
                              <div className="col-span-4 text-sm text-muted-foreground">
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>Resolution: {pkg.name === 'Pro' ? '4K UHD (3840x2160)' : 'Full HD (1920x1080)'}</li>
                                  <li>Lens: 2.8mm Wide Angle</li>
                                  <li>Night Vision: Up to 30m IR</li>
                                  <li>IP Rating: IP67 Weatherproof</li>
                                </ul>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <span className="font-bold col-span-4">Recording Unit (NVR/DVR)</span>
                              <div className="col-span-4 text-sm text-muted-foreground">
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>Channels: {pkg.name === 'Basic' ? '4 Channel' : pkg.name === 'Standard' ? '8 Channel' : '16 Channel'}</li>
                                  <li>Storage: {pkg.features.find(f => f.includes('Storage')) || '1 TB'} HDD Included</li>
                                  <li>Compression: H.265+ High Efficiency</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => {
                              mockDb.addOrder(pkg, 'package');
                              toast({ title: 'Package Selected!', description: `You ordered the ${pkg.name} package.` });
                            }}>
                              Confirm Purchase
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Survey Form Section */}
        <section id="survey" className="py-16 md:py-24 bg-background">
          <div ref={scrollRef} className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 font-headline">Request a Free Site Survey</h2>
              <p className="text-muted-foreground">
                Let our experts assess your security needs. Fill out the form below and we'll be in touch.
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSurveySubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(123) 456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us about your security needs..." className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="text-center">
                  <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Sending...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </section>
      </main>
      <Footer />
      <Chatbot />
    </>
  );
}
