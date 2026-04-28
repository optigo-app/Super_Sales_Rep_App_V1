// @ts-nocheck
'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function formatY(value) {
  if (value >= 1000) return `${value / 1000}k`;
  return String(value);
}

export default function SalesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatY}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: '1px solid #EDE9FE',
            fontSize: 12,
            boxShadow: '0 4px 16px rgba(124,58,237,0.12)',
          }}
          formatter={(value) =>
            [`₹${value.toLocaleString('en-IN')}`, undefined]
          }
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Line
          type="monotone"
          dataKey="Sales"
          stroke="#7C3AED"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#7C3AED', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Returns"
          stroke="#EF4444"
          strokeWidth={2}
          dot={{ r: 4, fill: '#EF4444', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
