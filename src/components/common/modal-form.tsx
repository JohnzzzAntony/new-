'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FormField {
  name: string
  label: string
  type?: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox'
  placeholder?: string
  options?: { label: string; value: string }[]
  required?: boolean
  disabled?: boolean
  step?: string
  colSpan?: number
}

interface ModalFormProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  fields: FormField[]
  values: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
  onSubmit: () => void
  loading?: boolean
  submitLabel?: string
}

export function ModalForm({
  open,
  onClose,
  title,
  description,
  fields,
  values,
  onChange,
  onSubmit,
  loading = false,
  submitLabel = 'Save',
}: ModalFormProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            {fields.map((field) => (
              <div
                key={field.name}
                className={field.colSpan === 2 ? 'md:col-span-2' : ''}
              >
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder={field.placeholder}
                    value={(values[field.name] as string) || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    disabled={field.disabled}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={(values[field.name] as string) || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    disabled={field.disabled}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center h-9">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      checked={!!values[field.name]}
                      onChange={(e) => onChange(field.name, e.target.checked)}
                      disabled={field.disabled}
                    />
                    <span className="ml-2 text-sm text-muted-foreground">Yes</span>
                  </div>
                ) : (
                  <input
                    type={field.type || 'text'}
                    step={field.step}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder={field.placeholder}
                    value={(values[field.name] as string) ?? ''}
                    onChange={(e) => onChange(field.name, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                    disabled={field.disabled}
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 pb-6 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
