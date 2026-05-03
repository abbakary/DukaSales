'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

type IconName =
  | 'auto_graph'
  | 'visibility'
  | 'visibility_off'
  | 'lock'
  | 'email'
  | 'arrow_right'
  | 'shield_check'
  ;

const iconMap = {
  auto_graph: BarChart3,
  visibility: Eye,
  visibility_off: EyeOff,
  lock: Lock,
  email: Mail,
  arrow_right: ArrowRight,
  shield_check: ShieldCheck,
} satisfies Record<IconName, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>;

const LoginShowcase = dynamic(
  () => import('@/components/auth/login-showcase').then((m) => m.LoginShowcase),
  { ssr: false, loading: () => null },
);

export default function LoginPage() {
  const TEAL_BG = 'oklch(0.61 0.1 178)';
  const YELLOW = 'oklch(0.85 0.2 85)';
  const ORANGE = '#f97316';

  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isHovering, setIsHovering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    if (!email.trim()) { setLocalError('Tafadhali ingiza baruapepe'); return; }
    if (!password) { setLocalError('Tafadhali ingiza nenosiri'); return; }

    const result = await login(email, password);
    if (result.success) {
      router.push(result.role === 'super_admin' ? '/admin' : '/dashboard');
    }
  };

  const displayError = error || localError;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${TEAL_BG} 0%, #0f5a4f 50%, #073b33 100%)` }}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* ── TOP: Logo & Tagline ── */}
      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <img 
            src="/splash/logo.png" 
            alt="Duka-Sales Logo" 
            className="w-16 h-16 object-contain animate-float drop-shadow-2xl"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/64x64?text=DS';
            }}
          />
          <h1
            className="text-5xl lg:text-6xl font-black tracking-tighter"
            style={{
              background: `linear-gradient(90deg, ${ORANGE} 0%, #ffd29b 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Duka-Sales
          </h1>
        </div>
        <p className="text-white/80 text-sm font-medium tracking-wide backdrop-blur-sm">
          Simamia biashara yako kwa urahisi na kisasa.
        </p>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="relative z-10 w-full max-w-5xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row" style={{ minHeight: 480 }}>

          {/* LEFT: Login Form */}
          <div className="w-full lg:w-[48%] p-8 lg:p-10 flex flex-col justify-between bg-white/50 backdrop-blur-sm">
            <div className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-widest">
                  <Icon name="email" className="w-3.5 h-3.5" />
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="admin@orbi-sales.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={cn(
                    'w-full h-12 px-4 rounded-xl text-sm font-medium',
                    'bg-white/80 text-gray-900 placeholder:text-gray-500',
                    'border border-gray-300 outline-none',
                    'focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400/20',
                    'transition-all duration-200'
                  )}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-widest">
                  <Icon name="lock" className="w-3.5 h-3.5" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      'w-full h-12 pl-4 pr-12 rounded-xl text-sm font-medium',
                      'bg-white/80 text-gray-900 placeholder:text-gray-500',
                      'border border-gray-300 outline-none',
                      'focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400/20',
                      'transition-all duration-200'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-500 transition-colors"
                  >
                    <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  className="text-xs font-semibold transition-colors hover:underline text-primary"
                >
                  Umesahau nenosiri?
                </button>
              </div>

              {/* Error */}
              {displayError && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs font-semibold text-destructive animate-shake">
                  <span>⚠️</span>
                  {displayError}
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                disabled={isLoading}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={handleSubmit as any}
                className={cn(
                  'w-full h-12 rounded-xl font-black text-sm tracking-widest uppercase',
                  'flex items-center justify-center gap-2',
                  'shadow-lg transition-all duration-300',
                  'bg-primary text-primary-foreground',
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                )}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    INGIA KWENYE MFUMO
                    <Icon
                      name="arrow_right"
                      className="w-4 h-4 transition-transform duration-300"
                      style={{ transform: isHovering ? 'translateX(4px)' : 'translateX(0)' }}
                    />
                  </>
                )}
              </button>

              {/* Register link */}
              <p className="text-center text-xs font-medium text-muted-foreground">
                Hauna akaunti?{' '}
                <button type="button" className="font-semibold hover:underline text-primary">
                  Jisajili hapa
                </button>
              </p>
            </div>

            {/* Trust bar */}
            <div className="flex items-center justify-center gap-6 pt-6 border-t border-border mt-6">
              <div className="text-center">
                <div className="text-foreground font-black text-lg leading-tight">500+</div>
                <div className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Wateja</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-foreground font-black text-lg leading-tight">24/7</div>
                <div className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Msaada</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-foreground font-black text-lg leading-tight">99.9%</div>
                <div className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Uptime</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded-full bg-sidebar flex items-center justify-center">
                  <Icon name="shield_check" className="w-3 h-3 text-sidebar-foreground" />
                </div>
                <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                  <Icon name="shield_check" className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>

          <LoginShowcase />
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-shake { animation: shake 0.3s ease-in-out 2; }
      `}</style>
    </div>
  );
}

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