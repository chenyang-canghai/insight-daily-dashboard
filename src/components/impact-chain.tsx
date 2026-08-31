export function ImpactChain({ items }: { items: string[] }) {
  return (
    <ol className="impact-chain" aria-label="影响传导链">
      {items.map((item, index) => (
        <li className="impact-step" key={item}>
          <small>{String(index + 1).padStart(2, "0")}</small>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
