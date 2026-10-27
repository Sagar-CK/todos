import { useRef, type ComponentProps, type ElementType } from "react";
import "./motion.css";

/** Fades content in from a soft blur when it mounts. Re-key to replay. */
export function BlurIn<T extends ElementType = "div">({
  as,
  className = "",
  ...props
}: { as?: T } & ComponentProps<T>) {
  const Tag: ElementType = as ?? "div";
  return <Tag className={`blur-in ${className}`.trim()} {...props} />;
}

/** Status text with a light sweep while work is in progress. */
export function Shimmer({ className = "", ...props }: ComponentProps<"span">) {
  return <span className={`shimmer ${className}`.trim()} {...props} />;
}

/** Hides its children until --loader-delay passes, so fast loads never flash a loader. */
export function Delayed({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`delayed ${className}`.trim()} {...props} />;
}

/** Renders growing text; each newly arrived chunk blurs in on its own. */
export function StreamingText({ text }: { text: string }) {
  const chunks = useRef<string[]>([]);
  const joined = chunks.current.join("");
  if (!text.startsWith(joined)) chunks.current = [];
  const known = chunks.current.join("").length;
  if (text.length > known)
    chunks.current = [...chunks.current, text.slice(known)];
  return (
    <>
      {chunks.current.map((chunk, i) => (
        <span key={i} className="stream-chunk">
          {chunk}
        </span>
      ))}
    </>
  );
}
