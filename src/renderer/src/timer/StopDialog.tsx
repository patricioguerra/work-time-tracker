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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stop Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="summary">What did you work on?</Label>
          <Textarea
            id="summary"
            placeholder="Describe what you accomplished…"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!summary.trim()}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
