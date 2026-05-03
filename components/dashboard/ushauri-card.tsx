"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { apiFetch } from "@/lib/api/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Lightbulb, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/use-i18n"

export function UshauriCard() {
  const { token, company } = useAuthStore()
  const { t, language } = useI18n()
  const [insights, setInsights] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [active, setActive] = useState(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    async function fetchInsights() {
      if (!token || !company?.id) return
      try {
        const url = `/tenant/insights?language=${language}`
        const response = await apiFetch<{ insights: string[] }>(url, {
          token
        })
        setInsights(response.insights || [])
      } catch (e) {
        console.error("Failed to fetch insights", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInsights()
  }, [token, company, language])

  useEffect(() => {
    if (insights.length <= 1) return
    const id = window.setInterval(() => {
      if (pausedRef.current) return
      setActive((a) => (a + 1) % insights.length)
    }, 4500)
    return () => window.clearInterval(id)
  }, [insights.length])

  const slides = useMemo(() => {
    const palettes = [
      {
        bg: "from-fuchsia-600 via-purple-600 to-indigo-700",
        chip: "bg-white/15 border-white/20 text-white",
      },
      {
        bg: "from-amber-400 via-orange-500 to-rose-500",
        chip: "bg-white/15 border-white/20 text-white",
      },
      {
        bg: "from-emerald-500 via-cyan-500 to-blue-600",
        chip: "bg-white/15 border-white/20 text-white",
      },
      {
        bg: "from-slate-900 via-slate-800 to-slate-900",
        chip: "bg-white/10 border-white/15 text-white",
      },
    ]
    return insights.map((text, i) => ({ text, ...palettes[i % palettes.length] }))
  }, [insights])

  useEffect(() => {
    if (active >= slides.length && slides.length > 0) {
      setActive(0)
    }
  }, [active, slides.length])

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-1/3 bg-muted rounded-xl mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-5/6 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (insights.length === 0) return null

  const go = (dir: -1 | 1) => {
    setActive((a) => {
      const next = a + dir
      if (next < 0) return slides.length - 1
      if (next >= slides.length) return 0
      return next
    })
  }

  return (
    <div
      className="rounded-2xl border border-sidebar-border/25 bg-white shadow-sm mb-6 overflow-hidden"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      <div className="p-5 md:p-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-black uppercase tracking-tight text-sidebar truncate">
              {t('dashboard.insights')}
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t('dashboard.smartBusinessHighlights')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => go(-1)}
            className="h-9 w-9 rounded-xl border bg-background hover:bg-muted transition-colors grid place-items-center"
            aria-label="Previous insight"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="h-9 w-9 rounded-xl border bg-background hover:bg-muted transition-colors grid place-items-center"
            aria-label="Next insight"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Slides */}
        <div className="relative h-[170px] sm:h-[160px] md:h-[150px]">
          {slides.map((s, i) => (
            <div
              key={i}
              className={[
                "absolute inset-0 p-5 md:p-6 text-white",
                "transition-opacity duration-500",
                i === active ? "opacity-100" : "opacity-0 pointer-events-none",
                "bg-gradient-to-br",
                s.bg,
              ].join(" ")}
            >
              {/* decorative glow */}
              <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute -bottom-12 -left-10 size-44 rounded-full bg-black/10 blur-2xl" />

              <div className="relative h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black ${s.chip}`}>
                    <Lightbulb className="size-4" />
                    USHAURI {i + 1}/{slides.length}
                  </div>
                  <div className="text-[11px] font-bold text-white/80">
                    {t('dashboard.liveUpdates')}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-2xl md:text-3xl font-black leading-tight tracking-tight drop-shadow-sm line-clamp-3">
                    {s.text}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {slides.map((_, dot) => (
                    <button
                      key={dot}
                      type="button"
                      onClick={() => setActive(dot)}
                      aria-label={`Go to insight ${dot + 1}`}
                      className={[
                        "h-2.5 rounded-full transition-all",
                        dot === active ? "w-10 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
