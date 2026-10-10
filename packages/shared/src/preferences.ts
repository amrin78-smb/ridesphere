import { z } from 'zod';

// Allowed values. Add to the end of a list; never rename or remove a published value,
// because stored preferences and older app versions depend on them.
export const bikeTypes = [
  'road',
  'gravel',
  'mountain',
  'touring',
  'folding',
  'hybrid',
  'bmx',
  'ebike',
] as const;
export const ridingStyles = [
  'social',
  'fitness',
  'training',
  'racing',
  'touring',
  'bikepacking',
  'commuting',
] as const;
export const paces = ['relaxed', 'steady', 'brisk', 'fast'] as const;
export const experienceLevels = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export const spokenLanguages = ['en', 'th', 'ms', 'id', 'vi', 'tl', 'zh'] as const;

export const MAX_DISTANCE_KM = 400;

export type BikeType = (typeof bikeTypes)[number];
export type RidingStyle = (typeof ridingStyles)[number];
export type Pace = (typeof paces)[number];
export type ExperienceLevel = (typeof experienceLevels)[number];
export type SpokenLanguage = (typeof spokenLanguages)[number];

const uniqueList = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .array(z.enum(values))
    .max(values.length)
    .refine((list) => new Set(list).size === list.length, 'Each value can appear only once.');

const distanceKm = z.number().int().min(1).max(MAX_DISTANCE_KM);

const preferencesShape = {
  bikeTypes: uniqueList(bikeTypes),
  ridingStyles: uniqueList(ridingStyles),
  languages: uniqueList(spokenLanguages),
  pace: z.enum(paces).nullable(),
  experience: z.enum(experienceLevels).nullable(),
  distanceMinKm: distanceKm.nullable(),
  distanceMaxKm: distanceKm.nullable(),
};

/** A member's riding preferences. Everything is optional: empty lists and nulls mean "not said". */
export const preferencesSchema = z.object(preferencesShape);
export type Preferences = z.infer<typeof preferencesSchema>;

/** Cross-field rule for a distance range, shared so the API and the app apply the same one. */
export const distanceRangeRule = {
  check: (p: Pick<Preferences, 'distanceMinKm' | 'distanceMaxKm'>) =>
    p.distanceMinKm === null || p.distanceMaxKm === null || p.distanceMinKm <= p.distanceMaxKm,
  params: {
    message: 'The shortest distance cannot be longer than the longest.',
    path: ['distanceMaxKm'],
  },
};

/** Replaces the whole set of preferences. Unknown fields are rejected. */
export const updatePreferencesRequestSchema = z
  .strictObject(preferencesShape)
  .refine(distanceRangeRule.check, distanceRangeRule.params);

export const emptyPreferences: Preferences = {
  bikeTypes: [],
  ridingStyles: [],
  languages: [],
  pace: null,
  experience: null,
  distanceMinKm: null,
  distanceMaxKm: null,
};
