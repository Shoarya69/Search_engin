export type CatalogBusiness = {
  id: string;
  name: string;
  slug?: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  business_type?: string | null;
  category_labels?: string[];
  search_text?: string;
  is_live?: boolean;
  pincode?: string | null;
};
