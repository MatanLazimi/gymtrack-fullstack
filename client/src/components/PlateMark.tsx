export function PlateMark({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="0" y="24" width="10" height="8" rx="1.5" fill="var(--color-accent)" />
      <rect x="46" y="24" width="10" height="8" rx="1.5" fill="var(--color-accent)" />
      <circle cx="28" cy="28" r="18" stroke="var(--color-accent)" strokeWidth="4" />
      <circle cx="28" cy="28" r="6" fill="var(--color-accent)" />
    </svg>
  );
}
