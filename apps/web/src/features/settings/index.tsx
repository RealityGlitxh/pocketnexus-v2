import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@pocketnexus/ui';
import { Monitor, Moon, Sun } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { NotConfiguredNotice, useAuth } from '@/features/auth';
import { useTheme, type ThemePreference } from '@/app/themeContext';

const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
];

export function SettingsPage() {
  const { preference, setPreference } = useTheme();
  const { state } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Personalise how PocketNexus looks and behaves on this device."
      />
      <Tabs defaultValue="appearance">
        <TabsList aria-label="Settings sections">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Saved on this device. Dark is the default.</CardDescription>
            </CardHeader>
            <CardContent>
              <fieldset>
                <legend className="sr-only">Theme</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {themeOptions.map(({ value, label, icon: Icon }) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface-sunken p-4 transition-colors hover:border-border-strong has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:ring-2 has-focus-visible:ring-focus"
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={value}
                        checked={preference === value}
                        onChange={() => {
                          setPreference(value);
                        }}
                        className="sr-only"
                      />
                      <Icon aria-hidden className="size-5 text-fg-muted" />
                      <span className="text-sm font-medium text-fg">{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Account <Badge tone="warning">In development</Badge>
              </CardTitle>
              <CardDescription>
                Email, password, privacy, and data export controls arrive in Phase 1.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {state.status === 'disabled' ? (
                <NotConfiguredNotice reason={state.reason} />
              ) : (
                <p className="text-sm text-fg-muted">
                  {state.status === 'signed_in'
                    ? `Signed in as ${state.user.email ?? 'your account'}.`
                    : 'Sign in to manage account settings.'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
