import type { Difficulty, MeetingDetailVisibility, Pace, Terrain } from '@ridesphere/shared';

// Display text for stored values. Kept in one place so it can move to translations later.

export const terrainLabels: Record<Terrain, string> = {
  road: 'Road',
  gravel: 'Gravel',
  trail: 'Trail',
  mixed: 'Mixed surfaces',
};

export const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
  expert: 'Expert',
};

export const paceShortLabels: Record<Pace, string> = {
  relaxed: 'Relaxed',
  steady: 'Steady',
  brisk: 'Brisk',
  fast: 'Fast',
};

/** Shown in place of exact meeting instructions the viewer may not see yet. */
export const meetingDetailsHiddenMessages: Record<MeetingDetailVisibility, string> = {
  public: 'The organiser has not added exact meeting instructions.',
  members: 'Sign in to see exactly where to meet.',
  participants: 'Exact meeting instructions are shared with riders who have joined this ride.',
};
