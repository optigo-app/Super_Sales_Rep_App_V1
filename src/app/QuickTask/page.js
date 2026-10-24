'use client';
import dynamic from 'next/dynamic';

const QuickTaskShell = dynamic(
  () => import('./QuickTaskShell'),
  { ssr: false }
);

export default function QuickTask() {
  return <QuickTaskShell />;
}