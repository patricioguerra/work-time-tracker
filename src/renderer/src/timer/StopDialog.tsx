import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'

interface StopDialogProps {
  open: boolean
  onConfirm: (summary: string) => void
  onCancel: () => void
}

export function StopDialog({ open, onConfirm, onCancel }: StopDialogProps) {
  const [summary, setSummary] = useState('')

  const handleConfirm = () => {
    if (!summary.trim()) return
    onConfirm(summary.trim())
    setSummary('')
  }

  const handleCancel = () => {
    setSummary('')
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="border-border/60 bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium tracking-wide text-foreground/80">
            Stop Session
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Label
            htmlFor="summary"
            className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/65"
          >
            What did you work on?
          </Label>
          <Textarea
            id="summary"
            placeholder="Describe what you accomplished…"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="resize-none border-border/50 bg-secondary/40 text-sm placeholder:text-muted-foreground/45 focus-visible:border-primary/35 focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={!summary.trim()}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
