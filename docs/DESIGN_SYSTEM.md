# Design System

Source of truth: [`packages/ui/src/tokens/tokens.css`](../packages/ui/src/tokens/tokens.css).

## Direction

Dark-first, esports-grade, restrained. Near-black surfaces with a faint violet bias, a single violet
primary for actions and active state, electric blue as a secondary accent. One decorative flourish
(a soft ambient glow behind the shell); everything else is flat, bordered, and calm.

## Token layers

1. **Palette** — `--pn-*` custom properties, defined per theme on `:root`/`[data-theme='dark']` and
   `[data-theme='light']`.
2. **Semantic roles** — `@theme inline` maps roles to palette, generating utilities:
   `bg-canvas`, `bg-surface`, `bg-surface-raised`, `bg-surface-overlay`, `bg-surface-sunken`,
   `border-border`, `border-border-strong`, `border-border-input`, `text-fg`, `text-fg-muted`,
   `text-fg-subtle`, `bg-primary`, `text-primary-text`, `bg-primary-soft`, `text-accent-text`,
   `bg-{success|warning|danger}-soft`, `text-{success|warning|danger}-text`, `ring-focus`,
   `shadow-{sm|md|lg|glow}`.
3. **Components** use only semantic utilities.

**Rules**
- No hex/rgb values or Tailwind default palette classes (`bg-violet-500`) in components.
- No `style={…}` in app code (ESLint error).
- New needs → add a semantic token, then use it.

## Typography

- **Inter Variable** (UI text) and **Space Grotesk Variable** (headings, brand) — self-hosted via
  `@fontsource-variable`, so no third-party font requests.
- Scale: Tailwind defaults plus `text-2xs` (11 px) for eyebrow labels.
- Headings use `text-balance`, `tracking-tight`.

## Spacing, radius, layout

- 4 px base grid (Tailwind spacing).
- Radius: `sm` 6 px, `md` 8 px (controls), `lg` 12 px (cards), `xl` 16 px (dialogs).
- Layout tokens: `--spacing-sidebar` (15.5 rem), `--spacing-topbar` (3.5 rem),
  `--container-content` (80 rem).
- Breakpoints: Tailwind defaults; sidebar becomes a drawer below `lg` (1024 px).

## Motion

120–220 ms, `ease-out-quint`. Fade, small scale, slide-in for the drawer. All animation is disabled
under `prefers-reduced-motion`.

## Accessibility

- Contrast verified for every text/background pair components use, in both themes, by
  `node scripts/check-contrast.mjs` (runs in CI). Text ≥ 4.5:1; input borders and focus ring ≥ 3:1.
- One shared `focusRing` (2 px `focus` color + offset) on every interactive element.
- Radix handles focus trapping, Esc, roving tab index, and ARIA for dialog/menu/tabs/toast.
- Form fields always have a label; hints and errors are wired via `aria-describedby`;
  invalid fields get `aria-invalid`.
- Skip link, landmark regions, and a single `h1` per page.
- Automated axe scan (WCAG 2.2 AA tags) on every route at desktop, tablet, mobile in Playwright.

## Components (`@pocketnexus/ui`)

| Component | Notes |
| --- | --- |
| `Button` | Variants `primary/secondary/ghost/danger/link`; sizes `sm/md/lg/icon/icon-sm`; `loading` sets `aria-busy` and disables; `asChild` for links; defaults to `type="button"` |
| `TextField` | Label + hint + error wiring |
| `SearchField` | Hidden label, leading icon, clear button |
| `Card` (+ Header/Title/Description/Content/Footer) | Bordered surface |
| `Badge` | Tones `neutral/primary/accent/success/warning/danger` |
| `Table` (+ Header/Body/Row/Head/Cell) | Scrolls horizontally inside its own container |
| `Dialog` | Requires a `title` (can be visually hidden) |
| `DropdownMenu` | Items support `destructive` |
| `Tabs` | Horizontal-scrolling list on small screens |
| `ToastProvider` / `useToast` | Max 4 visible; errors persist longer |
| `Skeleton`, `Spinner` | Skeletons are `aria-hidden`; wrap regions with `aria-busy` |
| `EmptyState`, `ErrorState` | `ErrorState` is `role="alert"` |
| `NavSection`, `NavItem` | Router-agnostic; active styling from `aria-current="page"` |

## Placeholder policy

Unfinished pages use `PlaceholderPage`: an **"In development"** badge, an explicit "No data shown
here is real" statement, and a list of *planned* capabilities. Never render invented numbers,
players, or tournament results.
