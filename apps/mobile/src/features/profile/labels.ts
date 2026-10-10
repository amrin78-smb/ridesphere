import type {
  BikeType,
  ExperienceLevel,
  Pace,
  RidingStyle,
  SpokenLanguage,
} from '@ridesphere/shared';

// Display text for stored values. Kept in one place so it can move to translations later.

export const bikeTypeLabels: Record<BikeType, string> = {
  road: 'Road',
  gravel: 'Gravel',
  mountain: 'Mountain',
  touring: 'Touring',
  folding: 'Folding',
  hybrid: 'Hybrid',
  bmx: 'BMX',
  ebike: 'E-bike',
};

export const ridingStyleLabels: Record<RidingStyle, string> = {
  social: 'Social',
  fitness: 'Fitness',
  training: 'Training',
  racing: 'Racing',
  touring: 'Touring',
  bikepacking: 'Bikepacking',
  commuting: 'Commuting',
};

export const paceLabels: Record<Pace, string> = {
  relaxed: 'Relaxed (under 20 km/h)',
  steady: 'Steady (20–25 km/h)',
  brisk: 'Brisk (25–30 km/h)',
  fast: 'Fast (over 30 km/h)',
};

export const experienceLabels: Record<ExperienceLevel, string> = {
  beginner: 'New to riding',
  intermediate: 'Ride regularly',
  advanced: 'Experienced',
  expert: 'Very experienced',
};

export const languageLabels: Record<SpokenLanguage, string> = {
  en: 'English',
  th: 'ไทย',
  ms: 'Bahasa Melayu',
  id: 'Bahasa Indonesia',
  vi: 'Tiếng Việt',
  tl: 'Filipino',
  zh: '中文',
};
