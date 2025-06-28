export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  category: string;
  subcategory?: string;
  material?: string;
  weight?: number;
  dimensions?: string;
  stock_quantity: number;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  product_metadata?: Record<string, unknown>;
  shop_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  category: string;
  subcategory?: string;
  material?: string;
  weight?: number;
  dimensions?: string;
  stock_quantity: number;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  product_metadata?: Record<string, unknown>;
  shop_id: string;
}
