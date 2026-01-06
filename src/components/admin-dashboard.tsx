'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { getInitials } from '@/lib/utils';
import { Wrench, Package, DollarSign, Mail, Users, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { utils, writeFile } from 'xlsx';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export default function AdminDashboard() {
  const t = useTranslations('Dashboard');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  const handleDownloadReport = () => {
    // Products Sheet
    const productsData = products.map(p => ({
      Name: p.name,
      SKU: p.sku,
      Price: p.price,
      "Net Price": p.net_price,
      Stock: p.stock,
      Status: p.status,
    }));

    // Packages Sheet
    const packagesData = pricing.map(pkg => ({
      Name: pkg.name,
      Price: pkg.price,
      Features: Array.isArray(pkg.features) ? pkg.features.join(", ") : pkg.features,
      Status: pkg.status,
      Popular: pkg.popular ? "Yes" : "No"
    }));

    const wb = utils.book_new();
    const wsProducts = utils.json_to_sheet(productsData);
    const wsPackages = utils.json_to_sheet(packagesData);

    utils.book_append_sheet(wb, wsProducts, "Products");
    utils.book_append_sheet(wb, wsPackages, "Packages");

    writeFile(wb, "Eyronix_Admin_Report.xlsx");
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        const [
          { data: productsData },
          { data: servicesData },
          { data: pricingData },
          { data: salesData }
        ] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('services').select('*'),
          supabase.from('pricing').select('*'),
          supabase.from('sales').select('*')
        ]);

        setProducts(productsData || []);
        setServices(servicesData || []);
        setPricing(pricingData || []);
        setSales(salesData || []);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Prepare chart data (dummy data for now, or aggregated from sales if possible)
  // For simplicity matching the previous structure, using a mock or simple aggregation
  const chartData = [
    { name: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Feb', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Apr', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'May', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Jun', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Jul', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Aug', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Sep', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Oct', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Nov', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Dec', total: Math.floor(Math.random() * 5000) + 1000 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('welcomeTitle')}</CardTitle>
            <CardDescription>{t('welcomeDesc')}</CardDescription>
          </div>
          <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t('downloadReport')}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.user_metadata?.avatar_url || undefined} />
                <AvatarFallback>{getInitials(user.user_metadata?.full_name || user.email)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold font-headline">{t('welcomeUser', { name: user.user_metadata?.full_name || 'Admin' })}</h3>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalServices')}</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{services.length}</div>}
            <p className="text-xs text-muted-foreground">
              {t('totalServicesDesc')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalProducts')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{products.length}</div>}
            <p className="text-xs text-muted-foreground">
              {t('totalProductsDesc')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pricingPackages')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{pricing.length}</div>}
            <p className="text-xs text-muted-foreground">
              {t('pricingPackagesDesc')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalProfit')}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  ${(products?.reduce((acc: number, curr: any) => acc + ((curr.price - (curr.net_price || 0)) * curr.stock), 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('totalProfitDesc')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('realizedRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold text-primary">
                  ${(sales?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('realizedRevenueDesc')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div >
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{t('revenueOverview')}</CardTitle>
            <CardDescription>{t('revenueOverviewDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="ps-2">
            {!chartData.length ? <div style={{ width: '100%', height: 350 }} /> :
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm text-start">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Total
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {`$${payload[0].value}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            }
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
