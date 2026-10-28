import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  Skeleton,
} from '@pocketnexus/ui';
import { useQuery } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { RequireAuth, useAuth } from '@/features/auth';
import { fetchOwnProfile } from '@/services/profile.service';

function ProfileDetails({ userId }: { userId: string }) {
  const query = useQuery({
    queryKey: ['user', userId, 'profile'],
    queryFn: async () => {
      const result = await fetchOwnProfile(userId);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
  });

  if (query.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }
  if (query.isError) {
    return <ErrorState title="Couldn't load your profile" description={query.error.message} />;
  }

  const p = query.data;
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <div>
        <dt className="text-xs font-medium tracking-wide text-fg-subtle uppercase">Username</dt>
        <dd className="mt-1 text-sm text-fg">{p.username}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium tracking-wide text-fg-subtle uppercase">Visibility</dt>
        <dd className="mt-1 text-sm text-fg capitalize">{p.visibility}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium tracking-wide text-fg-subtle uppercase">Member since</dt>
        <dd className="mt-1 text-sm text-fg">
          {new Date(p.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
        </dd>
      </div>
    </dl>
  );
}

function ProfileContent() {
  const { state } = useAuth();
  if (state.status !== 'signed_in') return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound aria-hidden className="size-4 text-fg-subtle" /> Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileDetails userId={state.user.id} />
      </CardContent>
    </Card>
  );
}

export function ProfilePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Profile"
        description="Your PocketNexus identity. Profile editing, avatars, and public pages arrive in Phase 1."
        badge={<Badge tone="warning">In development</Badge>}
      />
      <RequireAuth>
        <ProfileContent />
      </RequireAuth>
    </div>
  );
}
