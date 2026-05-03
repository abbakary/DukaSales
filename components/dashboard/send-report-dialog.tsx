"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Send, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api/client"
import { useAuthStore } from "@/lib/stores/auth-store"

export function SendReportDialog() {
  const { token, company } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState(company?.phone || "")
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!phone) {
      toast.error("Tafadhali ingiza namba ya simu")
      return
    }

    setIsSending(true)
    try {
      await apiFetch("/tenant/reports/send-daily", {
        method: "POST",
        token,
        body: JSON.stringify({ phone_number: phone })
      })
      toast.success("Ripoti imetumwa kikamilifu!")
      setOpen(false)
    } catch (e: any) {
      toast.error(`Imeshindwa kutuma ripoti: ${e.message}`)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 font-black shadow-md border-2 border-primary-foreground/10 uppercase tracking-wide">
          <Send className="w-4 h-4" />
          Tuma Ripoti ya Leo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tuma Ripoti ya Z-Report (SMS)</DialogTitle>
          <DialogDescription>
            Ripoti itajumuisha mauzo yote ya leo na idadi ya miamala iliyofanyika.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2">
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Namba ya Simu (Mfn: 0712345678)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button type="button" size="sm" className="px-3" onClick={handleSend} disabled={isSending}>
            <span className="sr-only">Tuma</span>
            {isSending ? <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
