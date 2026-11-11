import React from 'react';
import { Text, View } from 'react-native';
import { ClasificacionCliente, EstadoCompra } from '@/lib/supabase';

interface BadgeProps {
  label: string;
  type?: ClasificacionCliente | EstadoCompra | 'default';
  size?: 'sm' | 'md';
}

export function Badge({ label, type = 'default', size = 'sm' }: BadgeProps) {
  let bgClasses = 'bg-slate-100';
  let textClasses = 'text-slate-700';

  switch (type) {
    case 'Cliente VIP':
      bgClasses = 'bg-amber-100 border border-amber-200';
      textClasses = 'text-amber-800';
      break;
    case 'Cliente Frecuente':
      bgClasses = 'bg-blue-100 border border-blue-200';
      textClasses = 'text-blue-800';
      break;
    case 'Prospecto':
      bgClasses = 'bg-purple-100 border border-purple-200';
      textClasses = 'text-purple-800';
      break;
    case 'Lead':
      bgClasses = 'bg-emerald-100 border border-emerald-200';
      textClasses = 'text-emerald-800';
      break;
    case 'Inactivo':
    case 'Cancelado':
      bgClasses = 'bg-rose-100 border border-rose-200';
      textClasses = 'text-rose-800';
      break;
    case 'Pagado':
      bgClasses = 'bg-emerald-100 border border-emerald-200';
      textClasses = 'text-emerald-800';
      break;
    case 'Pendiente':
      bgClasses = 'bg-amber-100 border border-amber-200';
      textClasses = 'text-amber-800';
      break;
    default:
      bgClasses = 'bg-slate-100 border border-slate-200';
      textClasses = 'text-slate-700';
      break;
  }

  const padding = size === 'sm' ? 'px-2.5 py-0.5' : 'px-3 py-1';
  const fontSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <View className={`rounded-full items-center justify-center ${padding} ${bgClasses}`}>
      <Text className={`font-semibold ${fontSize} ${textClasses}`}>{label}</Text>
    </View>
  );
}
