import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Home,
  Car,
  Tv,
  HeartPulse,
  GraduationCap,
  Briefcase,
  DollarSign,
  PiggyBank,
  Gift,
  Plane,
  Smartphone,
  Wrench,
  Coffee,
  TrendingUp,
  Tag
} from 'lucide-react';

// Map of names to actual components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  ShoppingBag,
  Home,
  Car,
  Tv,
  HeartPulse,
  GraduationCap,
  Briefcase,
  DollarSign,
  PiggyBank,
  Gift,
  Plane,
  Smartphone,
  Wrench,
  Coffee,
  TrendingUp
};

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className = "h-5 w-5" }: CategoryIconProps) {
  const IconComponent = iconMap[name] || Tag;
  return <IconComponent className={className} />;
}
