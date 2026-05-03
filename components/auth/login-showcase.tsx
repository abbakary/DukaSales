'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Package,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Showcase = {
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  icon: IconName;
  accentColor: string;
  gradient: string;
  bgImage: string;
};

type IconName =
  | 'auto_graph'
  | 'visibility'
  | 'visibility_off'
  | 'lock'
  | 'email'
  | 'arrow_right'
  | 'shield_check'
  | 'trending_up'
  | 'inventory'
  | 'people';

const showcaseBackground = (start: string, end: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#bg)" />
      <circle cx="1280" cy="180" r="220" fill="rgba(255,255,255,0.12)" />
      <circle cx="250" cy="850" r="260" fill="rgba(255,255,255,0.08)" />
      <circle cx="880" cy="520" r="340" fill="rgba(255,255,255,0.08)" />
      <text x="110" y="860" fill="rgba(255,255,255,0.16)" font-size="120" font-family="Arial, sans-serif" font-weight="700">
        ${label}
      </text>
    </svg>
  `)}`;

const SHOWCASES: Showcase[] = [
  {
    title: 'Monitor',
    subtitle: 'Sales Performance',
    tagline: 'Boost Your Revenue!',
    description: 'Fuatilia mauzo, faida, na mwenendo wa biashara yako kwa muda halali.',
    icon: 'trending_up',
    accentColor: '#facc15',
    gradient: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #172554 100%)',
    bgImage: showcaseBackground('#1e40af', '#1e3a8a', 'Sales'),
  },
  {
    title: 'Track',
    subtitle: 'Inventory',
    tagline: 'Stay Organized!',
    description: 'Simamia bidhaa, ujue stock iliyobaki, na epuka kuishiwa vitu muhimu.',
    icon: 'inventory',
    accentColor: '#86efac',
    gradient: 'linear-gradient(135deg, #15803d 0%, #166534 50%, #14532d 100%)',
    bgImage: showcaseBackground('#15803d', '#166534', 'Stock'),
  },
  {
    title: 'Manage',
    subtitle: 'Customers',
    tagline: 'Build Loyalty!',
    description: 'Hifadhi taarifa za wateja na boresha huduma kwa mauzo ya haraka na sahihi.',
    icon: 'people',
    accentColor: '#fdba74',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 50%, #9a3412 100%)',
    bgImage: showcaseBackground('#ea580c', '#c2410c', 'CRM'),
  },
];

const iconMap = {
  auto_graph: BarChart3,
  visibility: Eye,
  visibility_off: EyeOff,
  lock: Lock,
  email: Mail,
  arrow_right: ArrowRight,
  shield_check: ShieldCheck,
  trending_up: TrendingUp,
  inventory: Package,
  people: Users,
} satisfies Record<IconName, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>;

function Icon({
  name,
  className,
  style,
}: {
  name: IconName;
  className?: string;
  style?: React.CSSProperties;
}) {
  const LucideIcon = iconMap[name];
  return <LucideIcon className={className} style={style} />;
}

export function LoginShowcase() {
  const [activeShowcase, setActiveShowcase] = useState(0);
  const active = SHOWCASES[activeShowcase];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveShowcase((prev) => (prev + 1) % SHOWCASES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* RIGHT: Showcase Panel */}
      <div className="hidden lg:flex w-[52%] flex-col overflow-hidden relative">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105 hover:scale-100"
          style={{
            backgroundImage: `url(${active.bgImage})`,
          }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background: active.gradient,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
          <Icon name={active.icon} className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-end p-10">
          {SHOWCASES.map((showcase, index) => (
            <div
              key={index}
              className={cn(
                'absolute inset-0 flex flex-col justify-end p-10 transition-all duration-700',
                index === activeShowcase
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6 pointer-events-none',
              )}
            >
              <div className="absolute top-6 right-6 opacity-10">
                <Icon name={showcase.icon} className="w-48 h-48 text-white" />
              </div>

              <div className="space-y-2 max-w-full">
                <div className="inline-flex items-center">
                  <div
                    className="text-white/95 text-[11px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${showcase.accentColor}80, ${showcase.accentColor}40)`,
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    {showcase.tagline}
                  </div>
                </div>

                <h2
                  className="text-white text-5xl font-black tracking-tighter leading-none"
                  style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}
                >
                  {showcase.title}
                </h2>

                <p
                  className="text-2xl font-bold italic"
                  style={{
                    color: showcase.accentColor,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {showcase.subtitle}
                </p>

                <p
                  className="text-white/95 text-sm font-medium pt-1 max-w-sm p-2 rounded-lg"
                  style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
                >
                  {showcase.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="relative z-10 flex items-center gap-0 border-t"
          style={{
            borderColor: 'rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {[
            { value: '500+', label: 'Wateja' },
            { value: '24/7', label: 'Msaada' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex-1 text-center py-4 border-r"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <div
                className="text-white font-black text-xl leading-tight"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
              >
                {stat.value}
              </div>
              <div className="text-white/80 text-[10px] uppercase tracking-widest font-semibold">
                {stat.label}
              </div>
            </div>
          ))}
          <div className="flex-1 flex items-center justify-center gap-2 py-4">
            <Icon name="shield_check" className="w-6 h-6 text-white/90" />
            <Icon name="shield_check" className="w-6 h-6 text-white/60" />
          </div>
        </div>

        <div className="absolute bottom-[72px] left-10 flex gap-2 z-20">
          {SHOWCASES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveShowcase(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                i === activeShowcase ? 'w-8' : 'w-2 bg-white/50 hover:bg-white/80',
                i === activeShowcase && 'bg-white',
              )}
              style={
                i === activeShowcase
                  ? {
                      background: `linear-gradient(90deg, ${SHOWCASES[i].accentColor}, white)`,
                      boxShadow: `0 0 8px ${SHOWCASES[i].accentColor}`,
                    }
                  : {}
              }
            />
          ))}
        </div>
      </div>

      {/* Mobile showcase */}
      <div className="lg:hidden relative z-10 w-full max-w-md mt-6">
        <div
          className="rounded-2xl overflow-hidden shadow-xl relative min-h-[200px]"
          style={{
            backgroundImage: `url(${active.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'background-image 0.7s ease',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 p-6" style={{ minHeight: 160 }}>
            <div className="absolute right-4 top-4 opacity-10">
              <Icon name={active.icon} className="w-24 h-24 text-white" />
            </div>

            <div className="space-y-1">
              <div
                className="inline-block text-white/95 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${active.accentColor}80, ${active.accentColor}40)`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {active.tagline}
              </div>
              <h3
                className="text-white text-3xl font-black tracking-tighter mt-2"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
              >
                {active.title}
              </h3>
              <p
                className="text-lg font-bold italic"
                style={{
                  color: active.accentColor,
                  textShadow: '1px 1px 1px rgba(0,0,0,0.2)',
                }}
              >
                {active.subtitle}
              </p>
              <p
                className="text-white/90 text-xs mt-1 p-1.5 rounded-lg inline-block"
                style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
              >
                {active.description}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex justify-center gap-2 pb-4">
            {SHOWCASES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveShowcase(i)}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i === activeShowcase ? 'w-8' : 'w-2 bg-white/50',
                )}
                style={
                  i === activeShowcase
                    ? { background: `linear-gradient(90deg, ${SHOWCASES[i].accentColor}, white)` }
                    : {}
                }
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

