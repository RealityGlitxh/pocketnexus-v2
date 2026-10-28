import { Button, EmptyState } from '@pocketnexus/ui';
import { Compass } from 'lucide-react';
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="That page doesn't exist — it may have moved during the PocketNexus 2.0 rebuild."
      action={
        <Button asChild variant="secondary">
          <Link to="/">Go to dashboard</Link>
        </Button>
      }
      className="mt-10"
    />
  );
}
