import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function FormSelect({
  id,
  label,
  placeholder,
  options,
  value,
  required,
  onValueChange,
}: {
  id: string
  label: string
  placeholder: string
  options: string[]
  value: string
  required?: boolean
  onValueChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required && <span className="text-destructive" aria-hidden="true">*</span>}</Label>
      <Select name={id} value={value} required={required} onValueChange={(nextValue) => {
        if (nextValue !== null) onValueChange(nextValue)
      }}>
        <SelectTrigger id={id} className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          <SelectGroup>
            {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
