import type { SketchType } from "../../scripts/lib/meta";

const TYPE_COLOR: Record<SketchType, string> = {
  p5: "#EC215C",
  p5play: "#EC215C",
  q5: "#B7EBFF",
  q5play: "#B7EBFF",
};

export function SketchTypeLabel({ type }: { type: SketchType }) {
  return (
    <span style={{ color: TYPE_COLOR[type] }} className="font-bold">
      {type}
    </span>
  );
}
