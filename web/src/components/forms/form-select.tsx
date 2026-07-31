import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type FormSelectOption = string | { label: string; value: string }

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
  options: FormSelectOption[]
  value: string
  required?: boolean
  onValueChange: (value: string) => void
}) {
  const selectOptions = options.map((option) => (
    typeof option === "string" ? { label: option, value: option } : option
  ))

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required && <span className="text-destructive" aria-hidden="true">*</span>}</Label>
      <Select items={selectOptions} name={id} value={value} required={required} onValueChange={(nextValue) => {
        if (nextValue !== null) onValueChange(nextValue)
      }}>
        <SelectTrigger id={id} className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          <SelectGroup>
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
