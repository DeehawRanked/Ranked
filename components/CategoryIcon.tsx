import { Car, Shirt, PawPrint, UtensilsCrossed, Monitor, Plane, Dumbbell, Mountain } from 'lucide-react';
import { Category } from '@/lib/types';

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  Cars: Car,
  Fits: Shirt,
  Pets: PawPrint,
  Food: UtensilsCrossed,
  'Setups & Spaces': Monitor,
  Travel: Plane,
  Fitness: Dumbbell,
  Outdoors: Mountain,
};

interface Props {
  category: Category;
  size?: number;
  className?: string;
}

export default function CategoryIcon({ category, size = 20, className = '' }: Props) {
  const Icon = CATEGORY_ICONS[category];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}
