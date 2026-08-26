"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { selectKeyAction } from "@/lib/intake/editor-helpers";

// A native <select> renders its option list with the OS/browser chrome, which
// ignores our dark theme and comes out unreadable. This is a drop-in
// replacement built from a button + listbox so the popup is ours to style.
//
// Keyboard behaviour follows the ARIA listbox pattern: Up/Down move, Home/End
// jump, Enter/Space commit, Escape cancels and returns focus to the trigger.

export type SelectOption = { value: string; label: string };

export function Select({
  value,
  options,
  onChange,
  id,
  ariaLabel,
  className = "",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  id?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // Which option the keyboard is on. Kept separate from `value` so arrowing
  // around doesn't commit a change until Enter.
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const listId = `${id ?? generatedId}-listbox`;

  // The popup is portalled to <body>. Every .surface-card sets backdrop-filter,
  // which creates a stacking context — a listbox rendered inside one is painted
  // under the cards that follow it and gets visually clipped, however high its
  // z-index. Portalling escapes that, at the cost of positioning it by hand.
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, top: r.bottom + 4, width: r.width });
    };
    place();
    // Follow the trigger if the page moves underneath the open list.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  // Close when a click goes elsewhere. The list lives in a portal, so it is not
  // inside rootRef — check both.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted option in view when arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({
      block: "nearest",
    });
  }, [open, activeIndex]);

  function openList() {
    setActiveIndex(selectedIndex);
    setOpen(true);
  }

  function commit(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const action = selectKeyAction(e.key, { open, activeIndex, length: options.length });
    if (action.type === "none") return;
    e.preventDefault();

    switch (action.type) {
      case "open":
        openList();
        break;
      case "close":
        setOpen(false);
        break;
      case "move":
        setActiveIndex(action.index);
        break;
      case "commit":
        commit(action.index);
        break;
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        className="w-full flex items-center justify-between gap-2 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-left text-slate-200 text-sm outline-none transition-colors hover:border-white/20 focus-visible:border-[#8b7cf6]/60"
      >
        <span className="truncate">{selected?.label ?? "Select…"}</span>
        <span
          aria-hidden="true"
          className={`text-[10px] text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && rect
        ? createPortal(
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          style={{ position: "fixed", left: rect.left, top: rect.top, width: rect.width }}
          className="z-[200] max-h-64 overflow-auto rounded-lg border border-[#8b7cf6]/25 bg-[#1e232f] shadow-2xl shadow-black/60 py-1"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                data-active={isActive}
                // onMouseDown, not onClick: the document pointerdown listener
                // would otherwise close the list before the click landed.
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(index);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  isActive ? "bg-[#8b7cf6]/[0.18] text-[#f1f3f9]" : "text-slate-300"
                } ${isSelected ? "font-semibold" : ""}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate">{option.label}</span>
                  {isSelected ? (
                    <span aria-hidden="true" className="text-[#e0b563] text-xs">
                      ✓
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>,
        document.body,
      )
        : null}
    </div>
  );
}
