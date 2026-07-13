// ============================================
// FILE: frontend/src/components/StarIcon.tsx
// PURPOSE: Reusable star icon component for favorite toggle
// PROPS
// ============================================

interface StarIconProps {
  filled?: boolean;
}

// ============================================
// COMPONENT: StarIcon
// ============================================
const StarIcon = ({ filled = false }: StarIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "#B8860B" : "none"}
    stroke={filled ? "#B8860B" : "#94a3b8"}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
  </svg>
);

export default StarIcon;