import { UNOFFICIAL_DISCLAIMER } from '@pocketnexus/shared';
import {
  Badge,
  Button,
  cn,
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  focusRing,
  NavItem,
  NavSection,
  useToast,
} from '@pocketnexus/ui';
import { LogIn, LogOut, Menu, Settings, UserRound } from 'lucide-react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { BrandMark } from '@/components/BrandMark';
import { RouteFallback } from '@/components/RouteFallback';
import { useAuth } from '@/features/auth';
import { env } from '@/lib/env';
import { accountNav, primaryNav, type NavEntry } from '@/routes/navigation';
import { signOut } from '@/services/auth.service';

function NavLinks({
  entries,
  label,
  onNavigate,
}: {
  entries: readonly NavEntry[];
  label: string;
  onNavigate?: (() => void) | undefined;
}) {
  return (
    <NavSection label={label}>
      {entries.map((entry) => (
        <NavItem
          key={entry.to}
          icon={entry.icon}
          label={entry.label}
          trailing={
            entry.status === 'placeholder' ? (
              <span
                aria-hidden
                className="rounded-sm bg-surface-overlay px-1.5 py-px text-2xs font-medium text-fg-subtle"
              >
                Soon
              </span>
            ) : null
          }
        >
          <NavLink
            to={entry.to}
            end={entry.end ?? false}
            onClick={onNavigate}
            // The visible "Soon" pill is decorative; state it explicitly for AT.
            aria-label={
              entry.status === 'placeholder' ? `${entry.label} (in development)` : undefined
            }
          />
        </NavItem>
      ))}
    </NavSection>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-(--spacing-topbar) shrink-0 items-center px-4">
        <Link
          to="/"
          onClick={onNavigate}
          className={cn('rounded-md', focusRing)}
          aria-label="PocketNexus home"
        >
          <BrandMark />
        </Link>
      </div>
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 pb-4">
        <NavLinks entries={primaryNav} label="Compete" onNavigate={onNavigate} />
        <NavLinks entries={accountNav} label="Account" onNavigate={onNavigate} />
      </nav>
      <p className="border-t border-border px-4 py-3 text-2xs leading-relaxed text-fg-subtle">
        Unofficial fan project. Not affiliated with Nintendo, The Pokémon Company, Creatures, or
        DeNA.
      </p>
    </div>
  );
}

function UserMenu() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (state.status !== 'signed_in') {
    return (
      <Button asChild variant="secondary" size="sm">
        <Link to="/auth/sign-in">
          <LogIn aria-hidden />
          Sign in
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <UserRound aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="truncate">
          {state.user.email ?? 'Signed in'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void navigate('/profile')}>
          <UserRound aria-hidden /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void navigate('/settings')}>
          <Settings aria-hidden /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={() => {
            void signOut().then((r) => {
              if (r.ok) void navigate('/');
              else
                toast({ title: 'Sign out failed', description: r.error.message, tone: 'danger' });
            });
          }}
        >
          <LogOut aria-hidden /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EnvironmentBadge() {
  if (env.appEnv === 'production') return null;
  return (
    <Badge
      tone={env.appEnv === 'staging' ? 'accent' : 'primary'}
      title="Build environment"
      className="hidden sm:inline-flex"
    >
      {env.appEnv}
    </Badge>
  );
}

function focusMain() {
  document.getElementById('main')?.focus();
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigatedFromDrawer = useRef(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isFirstRender = useRef(true);

  // Drawer links close the drawer themselves (no setState inside effects).
  const closeDrawerForNavigation = () => {
    navigatedFromDrawer.current = true;
    setMobileOpen(false);
  };

  // After client-side navigation, move focus to the new page's content so
  // keyboard and screen-reader users start at the page, not the old link.
  // When the drawer was the source, onCloseAutoFocus below does this instead
  // (focus can't leave the drawer's focus trap until it has closed).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!navigatedFromDrawer.current) focusMain();
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-ambient">
      <a
        href="#main"
        className={cn(
          'fixed top-2 left-2 z-[60] -translate-y-20 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-fg focus-visible:translate-y-0',
          focusRing,
        )}
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-(--spacing-sidebar) border-r border-border bg-surface/80 backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer (Radix Dialog: focus trap + Esc + scroll lock) */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          title="Navigation"
          hideTitle
          onCloseAutoFocus={(e) => {
            // The menu button lives outside the Dialog root, so Radix has no
            // trigger to restore focus to; do it explicitly.
            //  - Navigation: send focus to the new page.
            //  - Esc / close button / overlay: back to the menu button.
            e.preventDefault();
            if (navigatedFromDrawer.current) {
              navigatedFromDrawer.current = false;
              focusMain();
            } else {
              menuButtonRef.current?.focus();
            }
          }}
          className="top-0 left-0 h-dvh max-h-dvh w-(--spacing-sidebar) max-w-[85vw] translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-l-0 p-0 data-[state=open]:animate-slide-in-left"
        >
          <SidebarContent onNavigate={closeDrawerForNavigation} />
        </DialogContent>
      </Dialog>

      <div className="lg:pl-(--spacing-sidebar)">
        <header className="sticky top-0 z-20 flex h-(--spacing-topbar) items-center gap-3 border-b border-border bg-canvas/80 px-4 backdrop-blur-xl sm:px-6">
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => {
              setMobileOpen(true);
            }}
          >
            <Menu aria-hidden />
          </Button>
          <Link
            to="/"
            className={cn('min-w-0 rounded-md lg:hidden', focusRing)}
            aria-label="PocketNexus home"
          >
            <BrandMark compact />
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <EnvironmentBadge />
            <UserMenu />
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-(--container-content) px-4 py-8 outline-none sm:px-6 lg:px-10"
        >
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>

        <footer className="mx-auto w-full max-w-(--container-content) px-4 pb-8 sm:px-6 lg:px-10">
          <p className="border-t border-border pt-6 text-xs leading-relaxed text-fg-subtle">
            {UNOFFICIAL_DISCLAIMER}
          </p>
        </footer>
      </div>
    </div>
  );
}
