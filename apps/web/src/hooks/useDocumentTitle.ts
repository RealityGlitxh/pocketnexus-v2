import { APP_NAME } from '@pocketnexus/shared';
import { useEffect } from 'react';

/**
 * Sets a per-page document title ("Deck Lab · PocketNexus") so screen-reader
 * users hear a page change after client-side navigation and tabs/history
 * entries are distinguishable.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title === APP_NAME ? APP_NAME : `${title} · ${APP_NAME}`;
  }, [title]);
}
