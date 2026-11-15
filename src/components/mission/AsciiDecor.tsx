import { radar } from "ascii.rest/pieces";
import { Ascii, Banner } from "ascii.rest/react";

const canAnimate = () => typeof window !== "undefined" && typeof IntersectionObserver !== "undefined" && typeof ResizeObserver !== "undefined";

export function AsciiBanner({ text }: { text: string }) {
  if (!canAnimate()) return null;
  return (
    <div className="ascii-banner" aria-hidden="true">
      <Banner text={text} shadow="none" fill="#" mono />
    </div>
  );
}

export function AsciiRadar() {
  if (!canAnimate()) return null;
  return (
    <div className="ascii-radar" aria-hidden="true">
      <Ascii piece={radar} />
    </div>
  );
}
