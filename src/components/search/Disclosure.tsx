import { useId, useState, type ReactNode } from "react";

interface DisclosureProps {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Disclosure({ summary, children, defaultOpen = false, className = "" }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={`disclosure ${open ? "is-open" : ""} ${className}`.trim()}>
      <button type="button" className="disclosure__toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span className="disclosure__icon" aria-hidden="true">
          ▸
        </span>
        {summary}
      </button>
      <div id={id} className="disclosure__panel" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
