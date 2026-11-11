import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Acepta el nombre canónico (EXPO_PUBLIC_SUPABASE_ANON_KEY) y también
// EXPO_PUBLIC_SUPABASE_KEY, por si el .env usa el otro nombre.
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  'placeholder-anon-key';

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder-project') &&
  !supabaseAnonKey.includes('placeholder') &&
  !supabaseAnonKey.includes('your-anon-key');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export type ClasificacionCliente =
  | 'Lead'
  | 'Prospecto'
  | 'Cliente Frecuente'
  | 'Cliente VIP'
  | 'Inactivo';

export type EstadoCompra = 'Pagado' | 'Pendiente' | 'Cancelado';

export type TipoInteraccion = 'Llamada' | 'Reunión' | 'WhatsApp' | 'Correo' | 'Visita';

export interface Cliente {
  id: string;
  user_id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  empresa: string | null;
  clasificacion: ClasificacionCliente;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Compra {
  id: string;
  cliente_id: string;
  user_id: string;
  monto: number;
  descripcion: string;
  estado: EstadoCompra;
  fecha: string;
  created_at: string;
}

export interface Interaccion {
  id: string;
  cliente_id: string;
  user_id: string;
  tipo: TipoInteraccion;
  resumen: string;
  fecha_interaccion: string;
  proximo_seguimiento: string | null;
  created_at: string;
}
