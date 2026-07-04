import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════
// ASTRONOMICAL CALCULATIONS — Based on Jean Meeus, "Astronomical Algorithms"
// ═══════════════════════════════════════════════════════════

const SYNODIC_MONTH = 29.53058867;
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();

function moonAge(now: Date): number {
  const diff = now.getTime() - KNOWN_NEW_MOON;
  return (diff / 86400000) % SYNODIC_MONTH;
}

function moonPhaseFromAge(age: number): number {
  return age / SYNODIC_MONTH;
}

function illuminationPercent(phase: number): number {
  return (1 - Math.cos(phase * 2 * Math.PI)) / 2;
}

function phaseName(age: number): string {
  if (age < 1.85) return 'Новий Місяць';
  if (age < 5.55) return 'Зростаючий Серп';
  if (age < 9.25) return 'Перша Чверть';
  if (age < 12.95) return 'Зростаючий Gibbous';
  if (age < 16.65) return 'Повний Місяць';
  if (age < 20.35) return 'Спадний Gibbous';
  if (age < 24.05) return 'Остання Чверть';
  if (age < 27.75) return 'Спадний Серп';
  return 'Новий Місяць';
}

function phaseEmoji(age: number): string {
  if (age < 1.85) return '🌑';
  if (age < 5.55) return '🌒';
  if (age < 9.25) return '🌓';
  if (age < 12.95) return '🌔';
  if (age < 16.65) return '🌕';
  if (age < 20.35) return '🌖';
  if (age < 24.05) return '🌗';
  if (age < 27.75) return '🌘';
  return '🌑';
}

function moonDistance(now: Date): number {
  const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
  const daysSinceJ2000 = (now.getTime() - J2000) / 86400000;
  const M = (13.1763966 + 0.9856473 * daysSinceJ2000) % 360;
  const a = 384400;
  const e = 0.0549;
  const Mrad = (M * Math.PI) / 180;
  return Math.round(a * (1 - e * e) / (1 + e * Math.cos(Mrad)));
}

function moonPosition(now: Date): { ra: string; dec: string } {
  const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
  const T = (now.getTime() - J2000) / 86400000;
  const L0 = (218.3165 + 13.176396 * T) % 360;
  const M = (134.9634 + 13.064993 * T) % 360;
  const F = (93.2721 + 13.229350 * T) % 360;
  const lon = L0 + 6.289 * Math.sin((M * Math.PI) / 180);
  const lat = 5.128 * Math.sin((F * Math.PI) / 180);
  const lonRad = (lon * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const obliquity = 23.4393 * Math.PI / 180;
  const ra = Math.atan2(
    Math.sin(lonRad) * Math.cos(obliquity) - Math.tan(latRad) * Math.sin(obliquity),
    Math.cos(lonRad)
  );
  const dec = Math.asin(
    Math.sin(latRad) * Math.cos(obliquity) + Math.cos(latRad) * Math.sin(obliquity) * Math.sin(lonRad)
  );
  let raHours = ((ra * 180 / Math.PI) / 15 + 24) % 24;
  const raH = Math.floor(raHours);
  const raM = Math.floor((raHours - raH) * 60);
  const raS = Math.floor(((raHours - raH) * 60 - raM) * 60);
  const decDeg = dec * 180 / Math.PI;
  const decD = Math.floor(Math.abs(decDeg));
  const decM = Math.floor((Math.abs(decDeg) - decD) * 60);
  const sign = decDeg >= 0 ? '+' : '-';
  return { ra: `${raH}h ${raM}m ${raS}s`, dec: `${sign}${decD}° ${decM}'` };
}

function nextEvents(now: Date, currentAge: number) {
  const SYN = SYNODIC_MONTH;
  const daysUntilNew = SYN - currentAge;
  const daysUntilFull = (SYN / 2 - currentAge + SYN) % SYN;
  const daysUntilFirstQ = (SYN / 4 - currentAge + SYN) % SYN;
  const daysUntilLastQ = (3 * SYN / 4 - currentAge + SYN) % SYN;
  const addDays = (d: number) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + Math.floor(d));
    dt.setHours(18, 14, 0, 0);
    return dt.toISOString().split('T')[0];
  };
  return {
    nextNewMoon: addDays(daysUntilNew),
    nextFullMoon: addDays(daysUntilFull),
    nextFirstQuarter: addDays(daysUntilFirstQ),
    nextLastQuarter: addDays(daysUntilLastQ),
  };
}

function monthlyPhases(now: Date) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const phases: Array<{ date: string; age: number; phase: number; illumination: number; name: string; emoji: string }> = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d, 12, 0, 0);
    const age = moonAge(date);
    const phase = moonPhaseFromAge(age);
    phases.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      age, phase,
      illumination: illuminationPercent(phase),
      name: phaseName(age),
      emoji: phaseEmoji(age),
    });
  }
  return phases;
}

function moonLibration(now: Date): { lon: number; lat: number } {
  const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
  const T = (now.getTime() - J2000) / 86400000;
  const lon = -1.25 + 6.49 * Math.sin((134.9634 + 13.064993 * T) * Math.PI / 180);
  const lat = 4.88 - 4.37 * Math.sin((93.2721 + 13.229350 * T) * Math.PI / 180);
  return { lon: Math.round(lon * 10) / 10, lat: Math.round(lat * 10) / 10 };
}

function moonSurfaceTemp(illumPct: number) {
  // Day side: ~107°C (sunlit) — stays roughly constant regardless of phase
  // Night side: ~-173°C (shadow side) — always very cold
  // illumPct is 0-100
  return {
    daySide: Math.round(120 + (illumPct / 100) * 90),   // 120–210°C
    nightSide: Math.round(-180 + (illumPct / 100) * 57), // -180 to -123°C
  };
}

async function fetchNASAImage(now: Date): Promise<{ url: string; nasaPhase: number; nasaAge: number; nasaDistance: number; nasaDiameter: number }> {
  try {
    const utcHour = now.getUTCHours();
    const ts = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}T${String(utcHour).padStart(2, '0')}:00`;
    const res = await fetch(`https://svs.gsfc.nasa.gov/api/dialamoon/${ts}`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    return {
      url: data.image?.url || '',
      nasaPhase: data.phase ?? 0,
      nasaAge: data.age ?? 0,
      nasaDistance: data.distance ?? 0,
      nasaDiameter: data.diameter ?? 0,
    };
  } catch {
    return { url: '', nasaPhase: 0, nasaAge: 0, nasaDistance: 0, nasaDiameter: 0 };
  }
}

async function fetchMoonTimes(lat: number, lng: number) {
  try {
    const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0&date=today`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.status === 'OK') {
      return { moonrise: data.results.moonrise || null, moonset: data.results.moonset || null };
    }
    return { moonrise: null, moonset: null };
  } catch {
    return { moonrise: null, moonset: null };
  }
}

export async function GET() {
  const now = new Date();
  const age = moonAge(now);
  const phase = moonPhaseFromAge(age);
  const illum = illuminationPercent(phase);
  const dist = moonDistance(now);
  const pos = moonPosition(now);
  const events = nextEvents(now, age);
  const calendar = monthlyPhases(now);
  const libration = moonLibration(now);
  const surfaceTemp = moonSurfaceTemp(illum * 100);
  const moonTimes = await fetchMoonTimes(50.45, 30.52);
  const nasa = await fetchNASAImage(now);
  const progressPercent = (age / SYNODIC_MONTH) * 100;

  return NextResponse.json({
    timestamp: now.toISOString(),
    age: Math.round(age * 100) / 100,
    ageDays: Math.floor(age),
    ageHours: Math.floor((age - Math.floor(age)) * 24),
    ageMinutes: Math.floor(((age - Math.floor(age)) * 24 - Math.floor((age - Math.floor(age)) * 24)) * 60),
    phase: Math.round(phase * 1000) / 1000,
    phaseName: phaseName(age),
    phaseEmoji: phaseEmoji(age),
    illumination: Math.round(illum * 10000) / 10000,
    illuminationPercent: Math.round(illum * 10000) / 100,
    distance: dist,
    distanceMiles: Math.round(dist * 0.621371),
    position: pos,
    events,
    calendar,
    libration,
    surfaceTemp,
    moonTimes,
    synodicPeriod: Math.round(SYNODIC_MONTH * 100) / 100,
    progressPercent: Math.round(progressPercent * 10) / 10,
    orbitalVelocity: Math.round(2 * Math.PI * dist / (SYNODIC_MONTH * 86400) * 100) / 100,
    angularSize: Math.round((2 * 1737.4 / dist * 180 / Math.PI * 60) * 100) / 100,
    nasaImageUrl: nasa.url,
    nasaPhase: nasa.nasaPhase,
    nasaAge: Math.round(nasa.nasaAge * 100) / 100,
    nasaDistance: Math.round(nasa.nasaDistance),
    nasaDiameter: Math.round(nasa.nasaDiameter * 10) / 10,
  });
}
