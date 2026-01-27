"use client";

import * as React from "react";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Search from "lucide-react/dist/esm/icons/search";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const getOptionsFromChildren = (children: React.ReactNode): SelectOption[] => {
  return React.Children.toArray(children)
    .filter(React.isValidElement)
    .flatMap((child) => {
      if (typeof child.type === "string" && child.type === "option") {
        const { value, children: label, disabled } = child.props as {
          value?: string | number;
          children?: React.ReactNode;
          disabled?: boolean;
        };
        return [
          {
            value: value === undefined ? "" : String(value),
            label: typeof label === "string" ? label : String(label ?? ""),
            disabled
          }
        ];
      }
      return [];
    });
};

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, children, value, defaultValue, name, onChange, required, disabled, ...props }, ref) => {
    const options = React.useMemo(() => getOptionsFromChildren(children), [children]);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(() => {
      if (value !== undefined) return String(value);
      if (defaultValue !== undefined) return String(defaultValue);
      return options[0]?.value ?? "";
    });
    const currentValue = isControlled ? String(value ?? "") : internalValue;
    const currentOption = options.find((option) => option.value === currentValue) ?? options[0];
    const [query, setQuery] = React.useState("");
    const [open, setOpen] = React.useState(false);

    const filteredOptions = React.useMemo(() => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) return options;
      return options.filter((option) => option.label.toLowerCase().includes(normalized));
    }, [options, query]);

    const handleSelect = (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      if (onChange) {
        const event = {
          target: { value: nextValue, name }
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(event);
      }
      setOpen(false);
      setQuery("");
    };

    return (
      <>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <button
              ref={ref}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-brand-900 shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25 disabled:cursor-not-allowed disabled:bg-surface-50",
                className
              )}
              {...props}
            >
              <span className="truncate text-left">{currentOption?.label ?? "Select"}</span>
              <ChevronDown className={cn("h-4 w-4 text-brand-700 transition", open && "rotate-180")} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[220px] p-2">
            <div className="relative pb-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-700" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-brand-700/70">No matches found.</div>
              ) : (
                filteredOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    className={cn(
                      "justify-between text-sm",
                      option.disabled && "pointer-events-none opacity-50",
                      option.value === currentValue && "bg-surface-100 font-semibold"
                    )}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <span>{option.label}</span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {name ? <input type="hidden" name={name} value={currentValue} required={required} /> : null}
      </>
    );
  }
);

Select.displayName = "Select";
