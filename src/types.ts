export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  email: string;
  address?: string;
  phone?: string;
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
