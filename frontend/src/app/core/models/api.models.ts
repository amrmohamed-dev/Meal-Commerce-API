export interface ApiResponse<TData = unknown> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  data?: TData;
}

export interface ImageAsset {
  url: string | null;
  publicId: string | null;
}

export interface Address {
  street?: string;
  city?: string;
  notes?: string;
  phone?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: Address;
  image?: ImageAsset;
  favouriteMeals?: FavouriteMeal[];
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  image?: ImageAsset;
}

export interface Meal {
  _id: string;
  name: string;
  description: string;
  price: number;
  ratingAverage: number;
  ratingQuantity: number;
  category: Category | string;
  image: ImageAsset;
  preparationTime: number;
  createdAt?: string;
}

export interface FavouriteMeal {
  meal: Meal | string;
  addedAt: string;
}

export interface CartItem {
  meal: Meal;
  quantity: number;
  price: number;
}

export interface Cart {
  _id?: string;
  user: string;
  cartItems: CartItem[];
  totalPrice: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  _id: string;
  user: User | string;
  cartItems: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: 'cash' | 'card';
  isPaid: boolean;
  paidAt?: string;
  shippingAddress: {
    street: string;
    city: string;
    phone: string;
  };
  createdAt: string;
}

export interface OrderStat {
  _id: OrderStatus;
  nOrders: number;
  totalRevenue: number;
  avgOrderPrice: number;
}

export interface Review {
  _id: string;
  meal: Meal | string;
  user: User | string;
  rating: number;
  comment: string;
  createdAt: string;
}
