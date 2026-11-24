/** category_labels from catalog-data.json. These are categories, not products. */
export const CATALOG_CATEGORIES = [
  "Electronics",
  "Consumer Electronics",
  "Computer",
  "Laptops",
  "Headphones & Speakers",
  "Mobiles",
  "Air Conditioners",
  "Bluetooth Speakers",
  "Wireless earbuds",
  "IT Hardware",
  "Home Appliances",
  "Gifts & Retail",
  "IT Services",
  "Software",
  "Networking",
  "CCTV",
  "Healthcare",
  "Hospitals",
  "Food & Dining",
  "Restaurants",
  "Real Estate",
  "Property Developers",
  "Media Services",
  "Industrial Electronics",
  "Semiconductors",
  "Cables",
  "Audio-Video",
  "IT Products",
  "Toys",
  "Wholesale",
] as const;

function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\b([a-z]{4,})s\b/g, "$1");
}

const BY_NORM = new Map<string, string>(
  CATALOG_CATEGORIES.map((label) => [norm(label), label]),
);

/** "home appliance" / "home appliances" -> "Home Appliances". */
export function matchCategory(text: string): string | null {
  const key = norm(text);
  if (!key) return null;
  return BY_NORM.get(key) ?? null;
}

export function categoriesLongestFirst(): string[] {
  return [...CATALOG_CATEGORIES].sort((a, b) => b.length - a.length);
}
