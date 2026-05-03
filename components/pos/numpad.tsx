"use client"

import { useState } from "react"
import { Delete, Check, Zap, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface NumpadProps {
  onSubmit: (value: number) => void
  value?: string
  onChange?: (value: string) => void
  label?: string
  currency?: string
  suggestedAmount?: number
  activeMethod?: string
}

interface NumpadButtonProps {
  children: React.ReactNode
  onClick: () => void
  className?: string
}

function NumpadButton({ children, onClick, className }: NumpadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center rounded-xl border border-border/50 bg-background text-base font-black text-foreground hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95 shadow-sm",
        className
      )}
    >
      {children}
    </button>
  )
}

export function Numpad({
  onSubmit,
  value: controlledValue,
  onChange,
  label = "Enter Amount",
  currency = "TSh",
  suggestedAmount,
  activeMethod
}: NumpadProps) {
  const [internalValue, setInternalValue] = useState("")
  const isControlled = typeof controlledValue === "string"
  const value = isControlled ? controlledValue : internalValue

  const setValue = (nextValue: string | ((prev: string) => string)) => {
    const resolvedValue = typeof nextValue === "function"
      ? nextValue(value)
      : nextValue

    if (!isControlled) {
      setInternalValue(resolvedValue)
    }
    onChange?.(resolvedValue)
  }

  const press = (key: string) => {
    if (key === "." && value.includes(".")) return
    if (key === "." && value === "") { setValue("0."); return }
    if (key === "00" && value === "") return
    if (value.length >= 10) return // Limit length
    setValue(p => p + key)
  }

  const submit = () => {
    const n = parseFloat(value)
    if (!isNaN(n) && n > 0) {
      onSubmit(n)
      setValue("")
    }
  }

  const quickPay = (n: number) => {
    onSubmit(n)
    setValue("")
  }

  return (
    <div className="flex flex-col gap-1 p-1.5 bg-background/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm">
      <div className="flex items-center justify-between shrink-0 px-1 mb-0.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
        </div>
        <Badge variant="secondary" className="text-[8px] h-3.5 font-black uppercase bg-indigo-500/10 text-indigo-600 border-0">
          {activeMethod ?? 'COLLECT'}
        </Badge>
      </div>

      {/* Display */}
      <div className="relative shrink-0 group mb-0.5">
        <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-500/30 select-none pointer-events-none">
            {currency}
          </span>
          <Input
            type="text"
            inputMode="decimal"
            value={value}
            readOnly
            placeholder="0.00"
            className="h-9 pl-10 text-right text-lg font-black tracking-tighter border-2 border-border/50 bg-background/80 backdrop-blur-md rounded-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all shadow-[inner_0_2px_4px_rgba(0,0,0,0.05)]"
          />
        </div>
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-4 gap-1 shrink-0">
        {[5, 10, 20, 50].map(amt => (
          <button
            key={amt}
            type="button"
            onClick={() => quickPay(amt)}
            className="h-6 rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-[9px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all active:scale-95 shadow-sm"
          >
            {currency}{amt}
          </button>
        ))}
      </div>

      {/* Standardized Number & Action Grid */}
      <div className="grid grid-cols-3 gap-1">
        {/* Row 1 */}
        {["7", "8", "9"].map(key => (
          <NumpadButton key={key} onClick={() => press(key)}>{key}</NumpadButton>
        ))}
        {/* Row 2 */}
        {["4", "5", "6"].map(key => (
          <NumpadButton key={key} onClick={() => press(key)}>{key}</NumpadButton>
        ))}
        {/* Row 3 */}
        {["1", "2", "3"].map(key => (
          <NumpadButton key={key} onClick={() => press(key)}>{key}</NumpadButton>
        ))}
        
        {/* Row 4: Actions & 0 */}
        <button
          type="button"
          onClick={() => setValue("")}
          className="flex h-9 flex-col items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-[9px] font-black text-rose-600 uppercase hover:bg-rose-600 hover:text-white hover:border-transparent transition-all active:scale-95 shadow-sm"
        >
          <RotateCcw className="h-3.5 w-3.5 mb-0.5" />
          Clear
        </button>
        <NumpadButton onClick={() => press("0")}>0</NumpadButton>
        <button
          type="button"
          onClick={() => setValue(p => p.slice(0, -1))}
          className="flex h-9 items-center justify-center rounded-xl border border-border/50 bg-background text-muted-foreground hover:bg-muted transition-all active:scale-95 shadow-sm"
        >
          <Delete className="h-4.5 w-4.5" />
        </button>

        {/* Row 5: Special & Submit */}
        <NumpadButton onClick={() => press("00")} className="text-xs">00</NumpadButton>
        <NumpadButton onClick={() => press(".")} className="font-black">.</NumpadButton>
        <button
          type="button"
          onClick={submit}
          disabled={!value || parseFloat(value) <= 0}
          className={cn(
            "flex h-9 items-center justify-center rounded-xl font-black transition-all active:scale-95 shadow-md",
            value && parseFloat(value) > 0
              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
          )}
        >
          <Check className="h-5 w-5 stroke-[3px]" />
        </button>
      </div>

      {/* Exact amount shortcut */}
      {suggestedAmount && suggestedAmount > 0.01 && activeMethod?.toLowerCase() !== 'credit' && (
        <button
          type="button"
          onClick={() => quickPay(suggestedAmount)}
          className="shrink-0 h-7 mt-0.5 rounded-lg border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 text-emerald-600 text-[9px] font-black hover:bg-emerald-600 hover:text-white hover:border-solid transition-all flex items-center justify-center gap-2 group uppercase tracking-tight shadow-sm"
        >
          <Zap className="h-3.5 w-3.5 fill-emerald-500 group-hover:fill-white transition-colors" />
          PAY EXACT: {currency}{suggestedAmount.toFixed(2)}
        </button>
      )}
    </div>
  )
}
