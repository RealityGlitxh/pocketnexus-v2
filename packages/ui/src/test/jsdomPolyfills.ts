/**
 * jsdom does not implement a few browser APIs that Radix primitives call
 * (pointer capture for Toast swipe, scrollIntoView for menus, matchMedia).
 * Real browsers have them; these no-op stand-ins only exist for unit tests.
 * Playwright covers the real behaviour.
 */
export function installJsdomPolyfills(): void {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  const noop = () => undefined;
  for (const name of ['setPointerCapture', 'releasePointerCapture', 'scrollIntoView']) {
    if (!(name in proto)) proto[name] = noop;
  }
  if (!('hasPointerCapture' in proto)) proto.hasPointerCapture = () => false;

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: noop,
      removeEventListener: noop,
      addListener: noop,
      removeListener: noop,
      dispatchEvent: () => false,
    }),
  });
}
