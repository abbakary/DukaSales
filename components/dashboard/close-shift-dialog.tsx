"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Lock, Wallet } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api/client"
import { useAuthStore } from "@/lib/stores/auth-store"

export function CloseShiftDialog() {
  const { token, company } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [cash, setCash] = useState("")
  const [isClosing, setIsClosing] = useState(false)
  const [result, setResult] = useState<{ expected_cash: number; discrepancy: number } | null>(null)

  const handleCloseShift = async () => {
    if (!cash) {
      toast.error("Tafadhali ingiza kiasi kilichopo")
      return
    }

    setIsClosing(true)
    try {
      const response = await apiFetch<{ expected_cash: number; discrepancy: number }>("/tenant/shift/close", {
        method: "POST",
        token,
        body: JSON.stringify({ actual_cash: parseFloat(cash), notes: "Next.js Web POS" })
      })
      setResult(response)
      toast.success("Hesabu imefungwa kikamilifu!")
    } catch (e: any) {
      toast.error(`Imeshindwa kufunga hesabu: ${e.message}`)
    } finally {
      setIsClosing(false)
    }
  }

  const handleDone = () => {
    setOpen(false)
    setResult(null)
    setCash("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Lock className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>Funga Hesabu ya Siku</DialogTitle>
              <DialogDescription>
                Tafadhali ingiza kiasi cha pesa taslimu kilichopo kwenye droo yako kwa sasa.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 mt-4">
              <div className="grid flex-1 gap-2">
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Kiasi (Tsh)"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>Ghairi</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={handleCloseShift} disabled={isClosing}>
                {isClosing ? "Inafunga..." : "Funga Hesabu"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-emerald-600">Imekamilika</DialogTitle>
              <DialogDescription>
                Hesabu imefungwa kikamilifu. Ripoti imetumwa.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3 bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-muted-foreground">Pesa Inayotarajiwa:</span>
                <span className="text-sm font-black">{company?.currencySymbol || "Tsh"}{result.expected_cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-bold text-muted-foreground">Tofauti:</span>
                <span className={`text-sm font-black ${result.discrepancy < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {company?.currencySymbol || "Tsh"}{result.discrepancy.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleDone}>Sawa</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
