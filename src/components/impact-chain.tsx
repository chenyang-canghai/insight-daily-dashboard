import { ArrowRight } from "lucide-react";

export function ImpactChain({ items }: { items: string[] }) {
  return (
    <div className="impact-chain" role="list" aria-label="影响传导链">
      {items.map((item, index) => (
        <div className="impact-step-wrap" key={item}>
          <div className="impact-step" role="listitem">
            <small>0{index + 1}</small>
            <span>{item}</span>
          </div>
          {index < items.length - 1 && (
            <ArrowRight className="impact-arrow" size={18} aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}
