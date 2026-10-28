/**
 * Returns a same-origin, app-relative path from router state, or "/".
 * Rejects protocol-relative ("//host") and backslash tricks ("/\host") that
 * some browsers normalise into cross-origin URLs.
 */
export function safeReturnPath(state: unknown): string {
  const from = (state as { from?: unknown } | null | undefined)?.from;
  if (typeof from !== 'string') return '/';
  if (!from.startsWith('/') || from.startsWith('//') || from.includes('\\')) return '/';
  return from;
}
