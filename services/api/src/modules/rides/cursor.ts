import { AppError } from '../../common/errors';

export type RideCursor = { startsAt: Date; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Opaque to clients: the sort position of the last ride on a page. */
export function encodeCursor({ startsAt, id }: RideCursor): string {
  return btoa(`${startsAt.toISOString()}|${id}`).replace(/=+$/, '');
}

export function decodeCursor(cursor: string): RideCursor {
  try {
    const [iso, id] = atob(cursor).split('|');
    const startsAt = new Date(iso ?? '');
    if (!id || !UUID.test(id) || Number.isNaN(startsAt.getTime())) throw new Error('malformed');
    return { startsAt, id };
  } catch {
    throw new AppError(400, 'INVALID_CURSOR', 'That page link is not valid. Start again.');
  }
}
