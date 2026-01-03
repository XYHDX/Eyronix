'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

type SurveyRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'New' | 'Contacted' | 'Completed' | 'Archived';
  created_at: string; // Supabase returns ISO string
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'New': 'default',
  'Contacted': 'secondary',
  'Completed': 'outline',
  'Archived': 'destructive'
};

function RequestActions({ request, isUpdating, handleStatusChange, setItemToDelete }: { request: SurveyRequest; isUpdating: string | null; handleStatusChange: (id: string, status: SurveyRequest['status']) => void; setItemToDelete: (req: SurveyRequest) => void; }) {
  const t = useTranslations('RequestsPage');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isUpdating === request.id} aria-label="Request actions">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('actions.changeStatus')}</DropdownMenuLabel>
        {Object.keys(statusColors).map(status => (
          <DropdownMenuItem
            key={status}
            onSelect={() => handleStatusChange(request.id, status as SurveyRequest['status'])}
            disabled={request.status === status}
          >
            {status}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <AlertDialogTrigger asChild>
          <DropdownMenuItem className="text-red-600" onSelect={(e) => { e.preventDefault(); setItemToDelete(request) }}>
            {t('actions.delete')}
          </DropdownMenuItem>
        </AlertDialogTrigger>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export default function RequestsPage() {
  const t = useTranslations('RequestsPage');
  const { toast } = useToast();
  const [requests, setRequests] = React.useState<SurveyRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<SurveyRequest | null>(null);
  const isMobile = useIsMobile();

  const fetchRequests = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('survey_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as any[] || []); // Cast assuming shape match, or map timestamps
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('public:survey_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'survey_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [fetchRequests]);

  const sortedRequests = requests; // Already sorted by query

  const handleStatusChange = async (id: string, newStatus: SurveyRequest['status']) => {
    setIsUpdating(id);
    try {
      const { error } = await supabase
        .from('survey_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('toasts.statusUpdated'),
        description: t('toasts.statusUpdatedDesc', { status: newStatus })
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update status.'
      });
    } finally {
      setIsUpdating(null);
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('survey_requests')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast({
        title: t('toasts.deleted'),
        description: t('toasts.deletedDesc', { name: itemToDelete.name }),
      });
      setItemToDelete(null);
    } catch (error: any) {
      console.error('Error deleting request:', error);
      toast({
        variant: 'destructive',
        title: t('toasts.error'),
        description: error.message || 'Could not delete request.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderMobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-8" />
            </CardFooter>
          </Card>
        ))
      ) : sortedRequests.length > 0 ? (
        sortedRequests.map(request => (
          <AlertDialog key={request.id} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{request.name}</CardTitle>
                    <CardDescription>{request.email}</CardDescription>
                    <CardDescription>{request.phone}</CardDescription>
                  </div>
                  <RequestActions request={request} isUpdating={isUpdating} handleStatusChange={handleStatusChange} setItemToDelete={setItemToDelete} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">"{request.message}"</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center text-sm">
                <Badge variant={statusColors[request.status] || 'outline'}>
                  {request.status}
                </Badge>
                <span className="text-muted-foreground">
                  {request.created_at ? format(new Date(request.created_at), 'PPP') : 'N/A'}
                </span>
              </CardFooter>
            </Card>
            {itemToDelete && itemToDelete.id === request.id && renderAlertDialog()}
          </AlertDialog>
        ))
      ) : (
        renderEmptyState()
      )}
    </div>
  );

  const renderDesktopView = () => (
    <div className="rounded-md border relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.customer')}</TableHead>
            <TableHead>{t('table.message')}</TableHead>
            <TableHead>{t('table.submitted')}</TableHead>
            <TableHead>{t('table.status')}</TableHead>
            <TableHead>
              <span className="sr-only">{t('table.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))
          ) : sortedRequests.length > 0 ? (
            sortedRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="font-medium">{request.name}</div>
                  <div className="text-sm text-muted-foreground">{request.email}</div>
                  <div className="text-sm text-muted-foreground">{request.phone}</div>
                </TableCell>
                <TableCell className="max-w-sm truncate">
                  {request.message}
                </TableCell>
                <TableCell>
                  {request.created_at ? format(new Date(request.created_at), 'PPP') : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant={statusColors[request.status] || 'outline'}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <AlertDialog onOpenChange={(open) => !open && setItemToDelete(null)}>
                    <RequestActions request={request} isUpdating={isUpdating} handleStatusChange={handleStatusChange} setItemToDelete={setItemToDelete} />
                    {itemToDelete && itemToDelete.id === request.id && renderAlertDialog()}
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-48 text-center">
                {renderEmptyState()}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center p-8">
      <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">{t('table.noRequests')}</h3>
      <p className="mt-1 text-muted-foreground">
        {t('table.noRequestsDesc')}
      </p>
    </div>
  );

  const renderAlertDialog = () => (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{t('dialog.title')}</AlertDialogTitle>
        <AlertDialogDescription>
          {t('dialog.description', { name: itemToDelete?.name })}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => setItemToDelete(null)} disabled={isDeleting}>{t('actions.changeStatus')}</AlertDialogCancel>
        <AlertDialogAction onClick={() => handleDelete()} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
          {isDeleting ? t('actions.delete') : t('actions.delete')}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>
    </Card>
  );
}
