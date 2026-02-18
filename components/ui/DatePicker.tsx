import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value)

  const handleSelect = (selected: Date | undefined) => {
    setDate(selected)
    if (onChange) onChange(selected)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date
            ? date.toLocaleDateString("en-AU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : placeholder}
        </Button>
      </PopoverTrigger>

      {/* Popover content with white background */}
      <PopoverContent className="w-auto p-0 bg-white shadow-lg rounded-lg" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          className="bg-white text-black rounded-lg"
          classNames={{
            day: "hover:bg-gray-100 focus:bg-gray-100 rounded-md",
            day_selected: "bg-blue-500 text-white rounded-md", // optional: highlighted selected date
            caption: "bg-white text-black",
            nav: "bg-white text-black",
            head_cell: "bg-white text-gray-600",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
