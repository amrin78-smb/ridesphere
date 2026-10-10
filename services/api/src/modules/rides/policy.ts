import type { MeetingDetailVisibility, RideVisibility } from '@ridesphere/shared';

/** Who is looking: a visitor (undefined) or a signed-in, active member. */
export type Viewer = { id: string } | undefined;

type RideAccess = {
  organiserId: string | null;
  visibility: RideVisibility;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  meetingDetailsVisibleTo: MeetingDetailVisibility;
};

const isOrganiser = (ride: RideAccess, viewer: Viewer) =>
  viewer !== undefined && ride.organiserId === viewer.id;

/** Whether the viewer may open this ride at all. */
export function canViewRide(ride: RideAccess, viewer: Viewer): boolean {
  if (isOrganiser(ride, viewer)) return true;
  // Drafts are the organiser's alone. Cancelled and completed rides stay readable so that
  // links people already have keep working.
  if (ride.status === 'draft') return false;
  if (ride.visibility === 'public') return true;
  if (ride.visibility === 'members') return viewer !== undefined;
  // Private rides: organiser only, until invitations and RSVPs exist.
  return false;
}

/**
 * Whether the viewer may be told exactly where to meet. Being able to see a ride is not
 * enough: this is the control that keeps a private meeting point private.
 */
export function canSeeMeetingDetails(ride: RideAccess, viewer: Viewer): boolean {
  if (!canViewRide(ride, viewer)) return false;
  if (isOrganiser(ride, viewer)) return true;
  if (ride.meetingDetailsVisibleTo === 'public') return true;
  if (ride.meetingDetailsVisibleTo === 'members') return viewer !== undefined;
  // 'participants': nobody but the organiser until RSVPs exist (increment 6).
  return false;
}

/** Which visibilities appear in discovery for this viewer. Private rides are never listed. */
export function listableVisibilities(viewer: Viewer): RideVisibility[] {
  return viewer ? ['public', 'members'] : ['public'];
}
