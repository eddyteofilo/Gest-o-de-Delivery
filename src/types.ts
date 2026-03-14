export interface Plan {
  id: number;
  name: string;
  price: number;
  max_products: number;
  features: {
    marketing_tags?: boolean;
    custom_colors?: boolean;
    online_payment?: boolean;
    unlimited_products?: boolean;
    ai_assistant?: boolean;
    advanced_reports?: boolean;
    promotions?: boolean;
    couriers_management?: boolean;
    custom_domain?: boolean;
    multi_user?: boolean;
  };
}

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  email: string;
  address?: string;
  phone?: string;
  slogan?: string;
  logo_url?: string;
  mercadopago_token?: string;
  mercadopago_public_key?: string;
  pagseguro_token?: string;
  role?: 'restaurant' | 'superadmin';
  is_active?: boolean;
  plan_id?: number;
  plan?: Plan;
  google_tag_id?: string;
  fb_pixel_id?: string;
  tiktok_pixel_id?: string;
  primary_color?: string;
  secondary_color?: string;
  payment_config?: any;
  created_at?: string;
}

export interface Category {
  id: number;
  restaurant_id: number;
  name: string;
}

export interface ProductOption {
  id: number;
  product_id: number;
  name: string;
  price: number;
  max_quantity?: number;
}

export interface Product {
  id: number;
  restaurant_id: number;
  category_id?: number;
  category_name?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  available: boolean;
  is_daily_offer: boolean;
  options?: ProductOption[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  price: number;
  options?: string; // JSON string of selected options
}

export interface Order {
  id: number;
  restaurant_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled';
  courier_id?: number;
  courier_name?: string;
  payment_method?: 'pix' | 'credit_card' | 'cash' | 'card_on_delivery';
  payment_status?: string;
  payment_id?: string;
  payment_qr_code?: string;
  payment_qr_code_base64?: string;
  payment_link?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface Customer {
  id: number;
  restaurant_id: number;
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  created_at: string;
}

export interface Courier {
  id: number;
  restaurant_id: number;
  name: string;
  phone?: string;
  rg?: string;
  address?: string;
  vehicle_type?: 'moto' | 'carro' | 'bicicleta' | 'ape';
  vehicle_plate?: string;
  vehicle_renavam?: string;
  photo_url?: string;
  active: boolean;
}
export interface Promotion {
  id: number;
  restaurant_id: number;
  title: string;
  discount_text: string;
  image_url?: string;
  active: boolean;
  valid_until?: string;
  created_at: string;
}
