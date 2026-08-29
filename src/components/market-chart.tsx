"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function MarketChart({
  values,
  label,
}: {
  values: number[];
  label: string;
}) {
  const data = values.map((value, index) => ({ index: index + 1, value }));
  return (
    <div className="market-chart" aria-label={`${label} 迷你趋势图`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <XAxis dataKey="index" hide />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(value) => [String(value), label]}
            labelFormatter={() => "demo 趋势"}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
