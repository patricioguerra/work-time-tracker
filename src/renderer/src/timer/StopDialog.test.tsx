import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StopDialog } from './StopDialog'

describe('StopDialog', () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it('renders the dialog with a summary textarea', () => {
    render(<StopDialog open onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
  })

  it('Confirm button is disabled when summary is empty', () => {
    render(<StopDialog open onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled()
  })

  it('Confirm button is enabled when summary has text', async () => {
    render(<StopDialog open onConfirm={onConfirm} onCancel={onCancel} />)
    await userEvent.type(screen.getByRole('textbox'), 'Finished feature X')
    expect(screen.getByRole('button', { name: /confirm/i })).toBeEnabled()
  })

  it('calls onConfirm with the summary text', async () => {
    render(<StopDialog open onConfirm={onConfirm} onCancel={onCancel} />)
    await userEvent.type(screen.getByRole('textbox'), 'Done for today')
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledWith('Done for today')
  })

  it('calls onCancel when Cancel is clicked', async () => {
    render(<StopDialog open onConfirm={onConfirm} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('does not render when open is false', () => {
    render(<StopDialog open={false} onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
