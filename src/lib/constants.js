import { getThisWeekDates } from "./time.js";

export const WEEK = getThisWeekDates();

export const TIME_SLOTS = [
  { id: "morning", label: "Morning", sub: "8:00 AM – 11:00 AM", start: "08:00", end: "11:00" },
  { id: "lunch",   label: "Lunch",   sub: "12:00 PM – 3:00 PM",  start: "12:00", end: "15:00" },
  { id: "evening", label: "Evening", sub: "3:00 PM onward",      start: "15:00", end: null },
];

// Signup priority tiers: each standing can sign up once its date has passed.
export const TIERS = [
  { standing: "Officer",                              opensAt: new Date("2025-01-01") },
  { standing: "Member",                               opensAt: new Date("2025-01-01") },
  { standing: "Study Abroad/Graduating Early Member", opensAt: new Date("2025-01-01") },
  { standing: "Alumni",                               opensAt: new Date("2025-01-02") },
  { standing: "Guest",                                opensAt: new Date("2025-01-02") },
];

export const SIGNUP_DEADLINE  = new Date("2099-01-01");
export const REQUEST_DEADLINE = new Date("2099-01-01");
export const NOW = new Date();
