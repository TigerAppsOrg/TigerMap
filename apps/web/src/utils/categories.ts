import {
  BookOpen,
  Building2,
  Bus,
  Coffee,
  Dumbbell,
  GraduationCap,
  House,
  Info,
  Landmark,
  type LucideIcon,
  MapPin,
  Palette,
  ParkingCircle,
  Phone,
  Pizza,
  Shield,
  ShoppingBag,
  TrainFront,
  Trees,
  Users,
  Utensils,
  Waves,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Building: Building2,
  University: Landmark,
  "Academic Department": GraduationCap,
  "Administrative Department": Building2,
  College: Shield,
  Dormitory: House,
  Library: BookOpen,
  "Dining Hall": Utensils,
  Cafe: Coffee,
  Restaurant: Utensils,
  "Parking Lot": ParkingCircle,
  "Bus Stop": Bus,
  "Train Station": TrainFront,
  "Emergency Phone": Phone,
  "Public Art": Palette,
  Museum: Landmark,
  "Events Venue": Users,
  Theater: Users,
  Athletics: Dumbbell,
  "Sports Center": Dumbbell,
  "Fitness Center": Dumbbell,
  "Swimming Pool": Waves,
  Park: Trees,
  Shop: ShoppingBag,
  Information: Info,
  "@dining": Utensils,
  "@freefood": Pizza,
  "@clubs": Users,
};

export const QUICK_CATEGORIES = [
  { name: "@dining", label: "Dining" },
  { name: "@freefood", label: "Free food" },
  { name: "@clubs", label: "Clubs" },
];

export function getCategoryLabel(category: string): string {
  return QUICK_CATEGORIES.find((c) => c.name === category)?.label ?? category;
}

export function getCategoryColor(category: string | null | undefined): string {
  if (["@dining", "Dining Hall", "Cafe"].includes(category ?? "")) return "#47644b";
  if (["@freefood", "Restaurant"].includes(category ?? "")) return "#ad4d20";
  if (["@clubs", "College", "Dormitory"].includes(category ?? "")) return "#796249";
  if (category === "Library") return "#4e6679";
  return "#62695b";
}

export function getCategoryIcon(category: string | null | undefined): LucideIcon {
  return CATEGORY_ICONS[category ?? ""] ?? MapPin;
}
