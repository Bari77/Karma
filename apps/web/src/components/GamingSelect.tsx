"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";

export interface GamingSelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface GamingSelectProps<T extends string = string> {
  id?: string;
  value: T;
  onChange: (value: T) => void;
  options: GamingSelectOption<T>[];
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export function GamingSelect<T extends string = string>({
  id,
  value,
  onChange,
  options,
  className,
  disabled,
  "aria-label": ariaLabel,
}: GamingSelectProps<T>) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={clsx(
          "select-gaming flex w-full items-center justify-between gap-2 text-left",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className="min-w-0 truncate">{selected?.label ?? "—"}</span>
        <span
          className={clsx(
            "inline-flex shrink-0 origin-center transition-transform duration-200 ease-in-out",
            open ? "rotate-180" : "rotate-0"
          )}
          aria-hidden
        >
          <svg
            viewBox="0 0 12 12"
            className="h-3 w-3 fill-current text-purple-300/70"
            aria-hidden
          >
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={selectId}
          className="select-gaming-menu absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={clsx(
                    "select-gaming-option w-full text-left",
                    active && "select-gaming-option-active"
                  )}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
