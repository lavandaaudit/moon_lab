'use client';

import React, { useEffect, useState, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────
interface MoonData {
  timestamp: string;
  age: number;
  ageDays: number;
  ageHours: number;
  ageMinutes: number;
  phase: number;
  phaseName: string;
  phaseEmoji: string;
  illumination: number;
  illuminationPercent: number;
  distance: number;
  distanceMiles: number;
  position: { ra: string; dec: string };
  events: {
    nextNewMoon: string;
    nextFullMoon: string;
    nextFirstQuarter: string;
    nextLastQuarter: string;
  };
  calendar: Array<{
    date: string; age: number; phase: number; illumination: number; name: string; emoji: string;
  }>;
  libration: { lon: number; lat: number };
  surfaceTemp: { daySide: number; nightSide: number };
  moonTimes: { moonrise: string | null; moonset: string | null };
  synodicPeriod: number;
  progressPercent: number;
  orbitalVelocity: number;
  angularSize: number;
  nasaImageUrl: string;
  nasaPhase: number;
  nasaAge: number;
  nasaDistance: number;
  nasaDiameter: number;
}

// ── Starfield Background ────────────────────────────────
function Starfield() {
  const stars = React.useMemo(() => {
    const arr: Array<{ x: number; y: number; size: number; opacity: number; delay: number }> = [];
    for (let i = 0; i < 200; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.7 + 0.1,
        delay: Math.random() * 5,
      });
    }
    return arr;
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ background: '#000000' }}>
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `twinkle ${3 + star.delay}s ease-in-out infinite alternate`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Realistic Moon SVG (Photorealistic Grayscale) ──────
function MoonVisualization({ phase, illumination, size = 320 }: {
  phase: number; illumination: number; size?: number;
}) {
  const isWaxing = phase <= 0.5;
  const phaseAngle = phase * 2 * Math.PI;
  const terminator = Math.cos(phaseAngle);
  const r = size / 2;
  const cx = r;
  const cy = r;
  const ex = Math.abs(terminator) * r;

  let lightPath: string;
  if (isWaxing) {
    if (illumination < 0.5) {
      lightPath = `M ${cx} ${cy - r} A ${ex} ${r} 0 0 1 ${cx} ${cy + r} A ${r} ${r} 0 0 0 ${cx} ${cy - r}`;
    } else {
      lightPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${ex} ${r} 0 0 1 ${cx} ${cy - r}`;
    }
  } else {
    if (illumination < 0.5) {
      lightPath = `M ${cx} ${cy - r} A ${ex} ${r} 0 0 0 ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx} ${cy - r}`;
    } else {
      lightPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${ex} ${r} 0 0 0 ${cx} ${cy - r}`;
    }
  }

  const craters = [
    { x: 30, y: 25, r: 8, o: 0.15 }, { x: 55, y: 35, r: 12, o: 0.12 },
    { x: 40, y: 55, r: 6, o: 0.18 }, { x: 65, y: 50, r: 10, o: 0.1 },
    { x: 25, y: 60, r: 7, o: 0.14 }, { x: 50, y: 70, r: 9, o: 0.13 },
    { x: 70, y: 25, r: 5, o: 0.16 }, { x: 35, y: 42, r: 4, o: 0.2 },
    { x: 60, y: 65, r: 11, o: 0.11 }, { x: 45, y: 30, r: 3, o: 0.17 },
    { x: 55, y: 58, r: 5, o: 0.15 }, { x: 28, y: 45, r: 6, o: 0.12 },
    { x: 42, y: 78, r: 8, o: 0.1 }, { x: 72, y: 42, r: 7, o: 0.13 },
    { x: 33, y: 15, r: 4, o: 0.09 }, { x: 58, y: 18, r: 6, o: 0.11 },
  ];

  const mare = [
    { cx: 0.35, cy: 0.45, rx: 0.12, ry: 0.08, o: 0.2 },
    { cx: 0.55, cy: 0.38, rx: 0.18, ry: 0.1, o: 0.15 },
    { cx: 0.45, cy: 0.62, rx: 0.15, ry: 0.09, o: 0.18 },
    { cx: 0.62, cy: 0.55, rx: 0.1, ry: 0.07, o: 0.12 },
    { cx: 0.38, cy: 0.32, rx: 0.08, ry: 0.06, o: 0.14 },
    { cx: 0.52, cy: 0.72, rx: 0.11, ry: 0.06, o: 0.16 },
  ];

  return (
    <svg width={size + 40} height={size + 40} viewBox={`0 0 ${size + 40} ${size + 40}`}>
      <defs>
        <filter id="moonTexture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.04" numOctaves="5" seed="42" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" />
        </filter>
        <filter id="moonGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={size * 0.06} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="subtleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={size * 0.15} />
        </filter>
        <radialGradient id="moonGrad" cx="38%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#e8e4d4" />
          <stop offset="20%" stopColor="#d4d0c0" />
          <stop offset="45%" stopColor="#b8b4a4" />
          <stop offset="70%" stopColor="#9a9686" />
          <stop offset="90%" stopColor="#7a7670" />
          <stop offset="100%" stopColor="#5a5650" />
        </radialGradient>
        <radialGradient id="darkGrad" cx="55%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#08080f" />
        </radialGradient>
        <clipPath id="moonClip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      {/* Ambient glow */}
      <circle cx={cx} cy={cy} r={r + 6} fill="rgba(180,180,200,0.04)" filter="url(#subtleGlow)" />

      {/* Dark base */}
      <circle cx={cx} cy={cy} r={r} fill="url(#darkGrad)" />

      {/* Lit portion with texture */}
      <g clipPath="url(#moonClip)" filter="url(#moonTexture)">
        <path d={lightPath} fill="url(#moonGrad)" />
        {/* Mare (dark seas) */}
        {mare.map((m, i) => (
          <ellipse
            key={`m-${i}`}
            cx={m.cx * size} cy={m.cy * size}
            rx={m.rx * size} ry={m.ry * size}
            fill={`rgba(50, 48, 40, ${m.o})`}
          />
        ))}
        {/* Craters */}
        {craters.map((c, i) => (
          <g key={`c-${i}`}>
            <circle
              cx={(c.x / 100) * size} cy={(c.y / 100) * size}
              r={(c.r / 100) * size}
              fill={`rgba(70, 65, 55, ${c.o})`}
            />
            <circle
              cx={(c.x / 100) * size + 1} cy={(c.y / 100) * size + 1}
              r={(c.r / 100) * size * 0.8}
              fill={`rgba(90, 85, 75, ${c.o * 0.5})`}
            />
          </g>
        ))}
      </g>

      {/* Subtle rim light */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(140,140,160,0.08)" strokeWidth={1.5} />
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function MoonLabPage() {
  const [data, setData] = useState<MoonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState('');

  const fetchMoonData = useCallback(async () => {
    try {
      const res = await fetch('/api/moon');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      setData(json);
      setTime(new Date().toISOString().split('T')[1].split('.')[0]);
    } catch { /* silent retry on next interval */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMoonData();
    const interval = setInterval(fetchMoonData, 60000);
    const timeInterval = setInterval(() => {
      setTime(new Date().toISOString().split('T')[1].split('.')[0]);
    }, 1000);
    return () => { clearInterval(interval); clearInterval(timeInterval); };
  }, [fetchMoonData]);

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString('uk-UA', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Kiev',
      });
    } catch { return '—'; }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-[rgba(150,170,220,0.2)] border-t-[rgba(150,170,220,0.6)] animate-spin" />
          <p className="text-[rgba(150,170,220,0.6)] font-mono text-xs tracking-widest uppercase">Синхронізація даних Місяця...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Data rows
  const rows = [
    { label: 'ФАЗА', value: data.phaseName },
    { label: 'ВІК', value: `${data.ageDays}д ${data.ageHours}г ${data.ageMinutes}хв` },
    { label: 'ОСВІТЛЕНІСТЬ', value: `${data.illuminationPercent}%` },
    { label: 'ВІДСТАНЬ', value: `${data.distance.toLocaleString()} км` },
    { label: 'ШВИДКІСТЬ', value: `${data.orbitalVelocity} км/с` },
    { label: 'КУТОВИЙ РОЗМІР', value: `${data.angularSize}'` },
    { label: 'ПРЯМЕ СХИДЖЕННЯ', value: data.position.ra },
    { label: 'СХИЛЕННЯ', value: data.position.dec },
    { label: 'ЛІБРАЦІЯ', value: `${data.libration.lon}° / ${data.libration.lat}°` },
    { label: 'ТЕМП. ДЕННОЇ', value: `${data.surfaceTemp.daySide}°C` },
    { label: 'ТЕМП. НІЧНОЇ', value: `${data.surfaceTemp.nightSide}°C` },
    { label: 'МІСЯЦЕСХІД', value: formatTime(data.moonTimes.moonrise) },
    { label: 'МІСЯЦЕЗАХІД', value: formatTime(data.moonTimes.moonset) },
    { label: 'НАСТУПНИЙ ПОВНИЙ', value: formatDate(data.events.nextFullMoon) },
    { label: 'НАСТУПНИЙ НОВИЙ', value: formatDate(data.events.nextNewMoon) },
    { label: 'СИНОД. ПЕРІОД', value: `${data.synodicPeriod} дн` },
    { label: 'ЦИКЛ', value: `${data.progressPercent}%` },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#000', fontFamily: "'Geist', 'Geist Sans', sans-serif" }}>
      <Starfield />

      {/* ── Twinkle keyframes ── */}
      <style jsx global>{`
        @keyframes twinkle {
          0% { opacity: 0.1; }
          100% { opacity: 0.8; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ── Top Bar ── */}
        <div
          className="w-full px-6 sm:px-10 pt-8 pb-4 flex flex-col items-center text-center gap-2"
          style={{ animation: 'fadeIn 1.2s ease-out' }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase" style={{ color: 'rgba(150,170,220,0.6)' }}>
              Місія: Lunar-X1-Sync
            </span>
            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[0.15em] uppercase"
              style={{ color: '#ffffff', lineHeight: 1.1 }}
            >
              Ibonarium
            </h1>
            <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase" style={{ color: 'rgba(150,170,220,0.5)' }}>
              Місячна Лабораторія — Телеметрія в Реальному Часі
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs sm:text-sm font-mono tracking-wider" style={{ color: 'rgba(150,170,220,0.7)' }}>
              {time} UTC
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#4ade80', animation: 'pulseSlow 2s ease-in-out infinite' }}
              />
              <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: 'rgba(150,170,220,0.4)' }}>
                Наживо
              </span>
            </span>
          </div>
        </div>

        {/* ── Moon + Data ── */}
        <div className="flex-1 flex flex-col items-center px-4 sm:px-8 lg:px-16 pb-8">
          {/* Moon visualization */}
          <div
            className="flex justify-center mt-2 sm:mt-6 mb-6 sm:mb-10"
            style={{ animation: 'fadeIn 1.8s ease-out' }}
          >
            {/* NASA Dial-A-Moon Real Image */}
            <div className="relative">
              {data.nasaImageUrl ? (
                <img
                  src={data.nasaImageUrl}
                  alt="NASA Moon — Current Phase"
                  className="rounded-full"
                  style={{
                    width: 300,
                    height: 300,
                    objectFit: 'cover',
                    filter: 'drop-shadow(0 0 40px rgba(180,180,200,0.06))',
                  }}
                />
              ) : (
                <MoonVisualization phase={data.phase} illumination={data.illumination} size={260} />
              )}
            </div>
          </div>

          {/* Phase label under moon */}
          <div
            className="text-center mb-8 sm:mb-12"
            style={{ animation: 'fadeIn 2.2s ease-out' }}
          >
            <p className="text-lg sm:text-xl tracking-[0.3em] uppercase font-light" style={{ color: '#ffffff' }}>
              {data.phaseName}
            </p>
            <p className="text-xs sm:text-sm font-mono mt-1 tracking-wider" style={{ color: 'rgba(150,170,220,0.5)' }}>
              Освітленість {data.illuminationPercent}%
            </p>
            {/* Thin progress line */}
            <div className="mt-3 mx-auto w-48 sm:w-64 h-[1px] relative" style={{ background: 'rgba(150,170,220,0.1)' }}>
              <div
                className="absolute top-0 left-0 h-full"
                style={{
                  width: `${data.progressPercent}%`,
                  background: 'linear-gradient(to right, rgba(150,170,220,0.05), rgba(150,170,220,0.5))',
                  transition: 'width 1s ease',
                }}
              />
            </div>
            <div className="flex justify-between mt-1 mx-auto w-48 sm:w-64">
              {['НМ', 'ПЧ', 'ПМ', 'ОЧ'].map((m) => (
                <span key={m} className="text-[7px] tracking-wider" style={{ color: 'rgba(150,170,220,0.2)' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* ── Telemetry Data Grid ── */}
          <div
            className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4 sm:gap-y-5"
            style={{ animation: 'fadeIn 2.6s ease-out' }}
          >
            {rows.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <span
                  className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-medium"
                  style={{ color: 'rgba(150,170,220,0.35)' }}
                >
                  {row.label}
                </span>
                <span
                  className="text-sm sm:text-base font-mono tracking-wide"
                  style={{ color: 'rgba(220,225,235,0.85)' }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* ── Monthly Calendar Strip ── */}
          <div
            className="w-full max-w-4xl mt-12 sm:mt-16"
            style={{ animation: 'fadeIn 3s ease-out' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] tracking-[0.25em] uppercase" style={{ color: 'rgba(150,170,220,0.3)' }}>
                Щомісячний Огляд
              </span>
              <div className="flex-1 h-[1px]" style={{ background: 'rgba(150,170,220,0.06)' }} />
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-15 gap-1.5 sm:gap-2">
              {data.calendar.map((day) => {
                const dayNum = parseInt(day.date.split('-')[2]);
                const isToday = dayNum === new Date().getDate();
                const isWaxing = day.phase <= 0.5;
                const phaseAngle = day.phase * 2 * Math.PI;
                const term = Math.cos(phaseAngle);
                const sz = 20;
                const rr = sz / 2;
                const exx = Math.abs(term) * rr;
                let lp: string;
                if (isWaxing) {
                  if (day.illumination < 0.5) {
                    lp = `M ${rr} 0 A ${exx} ${rr} 0 0 1 ${rr} ${sz} A ${rr} ${rr} 0 0 0 ${rr} 0`;
                  } else {
                    lp = `M ${rr} 0 A ${rr} ${rr} 0 0 1 ${rr} ${sz} A ${exx} ${rr} 0 0 1 ${rr} 0`;
                  }
                } else {
                  if (day.illumination < 0.5) {
                    lp = `M ${rr} 0 A ${exx} ${rr} 0 0 0 ${rr} ${sz} A ${rr} ${rr} 0 0 1 ${rr} 0`;
                  } else {
                    lp = `M ${rr} 0 A ${rr} ${rr} 0 0 0 ${rr} ${sz} A ${exx} ${rr} 0 0 0 ${rr} 0`;
                  }
                }
                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-1 py-1.5 rounded-md transition-colors"
                    style={{
                      background: isToday ? 'rgba(150,170,220,0.06)' : 'transparent',
                    }}
                  >
                    <span
                      className="text-[8px] font-mono"
                      style={{
                        color: isToday ? 'rgba(150,170,220,0.8)' : 'rgba(150,170,220,0.2)',
                        fontWeight: isToday ? 600 : 400,
                      }}
                    >
                      {dayNum}
                    </span>
                    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
                      <circle cx={rr} cy={rr} r={rr - 0.5} fill="#0a0a14" />
                      <clipPath id={`mc-${day.date}`}>
                        <circle cx={rr} cy={rr} r={rr - 0.5} />
                      </clipPath>
                      <g clipPath={`url(#mc-${day.date})`}>
                        <path d={lp} fill="rgba(200,200,210,0.7)" />
                      </g>
                    </svg>
                    <span className="text-[7px] font-mono" style={{ color: 'rgba(150,170,220,0.15)' }}>
                      {day.illumination > 0 ? `${Math.round(day.illumination * 100)}` : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="mt-auto px-6 sm:px-10 py-5 flex items-center justify-between">
          <span className="text-[8px] tracking-[0.2em] uppercase" style={{ color: 'rgba(150,170,220,0.15)' }}>
            Ibonarium Moon Lab © 2025
          </span>
          <span className="text-[8px] tracking-[0.15em] uppercase" style={{ color: 'rgba(150,170,220,0.12)' }}>
            Джерела: Алгоритм Міуса + NASA SVS Dial-A-Moon
          </span>
        </footer>
      </div>
    </div>
  );
}
