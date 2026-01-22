import * as React from "react"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    data-state={checked ? "checked" : "unchecked"}
    disabled={disabled}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 shadow-inner group/switch",
      checked 
        ? "bg-primary shadow-lg shadow-primary/20" 
        : "bg-muted-foreground/30 hover:bg-muted-foreground/40",
      className
    )}
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled && onCheckedChange) onCheckedChange(!checked);
    }}
    ref={ref}
    {...props}
  >
    <span
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xl ring-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/switch:scale-110",
        checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </button>
))
Switch.displayName = "Switch"

export { Switch }
