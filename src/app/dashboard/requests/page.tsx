
'use client';

import * as React from 'react';
import { collection, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
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
  createdAt: Timestamp;
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'New': 'default',
  'Contacted': 'secondary',
  'Completed': 'outline',
  'Archived': 'destructive'
};

function RequestActions({ request, isUpdating, handleStatusChange, setItemToDelete }: { request: SurveyRequest; isUpdating: string | null; handleStatusChange: (id: string, status: SurveyRequest['status']) => void; setItemToDelete: (req: SurveyRequest) => void; }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isUpdating === request.id} aria-label="Request actions">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
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
            Delete
          </DropdownMenuItem>
        </AlertDialogTrigger>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export default function RequestsPage() {
  const firestore = useFirestore();
  const requestsCollection = 'survey-requests';
  const { data: requests, isLoading } = useCollection<SurveyRequest>(requestsCollection);
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<SurveyRequest | null>(null);
  const isMobile = useIsMobile();

  const sortedRequests = React.useMemo(() => {
    if (!requests) return [];
    return [...requests].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }, [requests]);

  const handleStatusChange = async (id: string, newStatus: SurveyRequest['status']) => {
    if (!firestore) return;
    setIsUpdating(id);
    const requestDocRef = doc(firestore, 'survey-requests', id);

    updateDoc(requestDocRef, { status: newStatus })
      .then(() => {
        toast({
          title: 'Status Updated',
          description: `Request has been marked as ${newStatus}.`
        });
      })
      .catch((error) => {
        console.error('Error updating status:', error);
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: `survey-requests/${id}`,
            operation: 'update',
            requestResourceData: { status: newStatus },
          })
        );
      })
      .finally(() => {
        setIsUpdating(null);
      });
  }

  const handleDelete = async () => {
    if (!itemToDelete || !firestore) return;
    setIsDeleting(true);
    const requestDocRef = doc(firestore, 'survey-requests', itemToDelete.id);

    deleteDoc(requestDocRef)
      .then(() => {
        toast({
          title: 'Request Deleted',
          description: `The request from ${itemToDelete.name} has been deleted.`,
        });
      })
      .catch((error) => {
        console.error('Error deleting request:', error);
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: `survey-requests/${itemToDelete.id}`,
            operation: 'delete',
          })
        );
      })
      .finally(() => {
        setIsDeleting(false);
        setItemToDelete(null);
      });
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
                <span className="text-muted-foreground">{format(request.createdAt.toDate(), 'PPP')}</span>
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
            <TableHead>Customer</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
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
                  {format(request.createdAt.toDate(), 'PPP')}
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
      <h3 className="mt-4 text-lg font-semibold">No survey requests yet</h3>
      <p className="mt-1 text-muted-foreground">
        New submissions from your website will appear here.
      </p>
    </div>
  );

  const renderAlertDialog = () => (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete the request from <span className="font-bold">{itemToDelete?.name}</span>.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => setItemToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => handleDelete()} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
          {isDeleting ? 'Deleting...' : 'Delete'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Survey Requests</CardTitle>
        <CardDescription>
          Manage incoming requests for site surveys from potential customers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>
    </Card>
  );
}
