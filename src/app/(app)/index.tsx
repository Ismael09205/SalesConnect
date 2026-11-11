import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { supabase, Cliente, ClasificacionCliente } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppLottie } from '@/components/ui/lottie-view';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ModalFeedback } from '@/components/ui/modal-feedback';
import { sanitizeText, translateError } from '@/lib/validation';
import { Animations } from '@/constants/animations';

const CLASIFICACIONES: (ClasificacionCliente | 'Todos')[] = [
  'Todos',
  'Lead',
  'Prospecto',
  'Cliente Frecuente',
  'Cliente VIP',
  'Inactivo',
];

export default function ClientsDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [totalCompras, setTotalCompras] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ClasificacionCliente | 'Todos'>('Todos');
  const [clienteAEliminar, setClienteAEliminar] = useState<Cliente | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const fetchClientes = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clientes:', error.message);
      } else {
        setClientes(data || []);
      }

      // Fetch sum of all compras
      const { data: comprasData } = await supabase
        .from('compras')
        .select('monto');

      if (comprasData) {
        const total = comprasData.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
        setTotalCompras(total);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClientes();
  }, [fetchClientes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClientes();
  };

  const confirmDeleteClient = async () => {
    if (!clienteAEliminar) return;
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', clienteAEliminar.id);

    if (error) {
      setDeleteError(translateError(error, 'No se pudo eliminar el cliente. Inténtalo de nuevo.'));
    } else {
      const eliminadoId = clienteAEliminar.id;
      setClientes((prev) => prev.filter((c) => c.id !== eliminadoId));
    }
    setClienteAEliminar(null);
  };

  const filteredClientes = clientes.filter((c) => {
    const matchesFilter =
      selectedFilter === 'Todos' || c.clasificacion === selectedFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.nombre.toLowerCase().includes(query) ||
      (c.empresa && c.empresa.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header con Métricas: se separa de la barra de estado / notch con el inset superior */}
      <View
        className="bg-white border-b border-slate-100 px-5 pb-4 rounded-b-3xl shadow-sm"
        style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center mb-5">
          <View className="flex-1">
            <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              SalesConnect
            </Text>
            <Text className="text-xl font-extrabold text-slate-900 tracking-tight">
              Panel de Clientes
            </Text>
          </View>
        </View>

        {/* Tarjetas de Métricas Rápidas */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-blue-50 border border-blue-100 rounded-2xl p-3">
            <Text className="text-[11px] font-semibold text-blue-600">
              Total Clientes
            </Text>
            <Text className="text-xl font-bold text-blue-950 mt-0.5">
              {clientes.length}
            </Text>
          </View>

          <View className="flex-1 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
            <Text className="text-[11px] font-semibold text-emerald-600">
              Ventas Totales
            </Text>
            <Text className="text-xl font-bold text-emerald-950 mt-0.5">
              ${totalCompras.toFixed(2)}
            </Text>
          </View>

          <View className="flex-1 bg-purple-50 border border-purple-100 rounded-2xl p-3">
            <Text className="text-[11px] font-semibold text-purple-600">
              VIP / Activos
            </Text>
            <Text className="text-xl font-bold text-purple-950 mt-0.5">
              {clientes.filter((c) => c.clasificacion === 'Cliente VIP' || c.clasificacion === 'Cliente Frecuente').length}
            </Text>
          </View>
        </View>
      </View>

      {/* Barra de Búsqueda */}
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 gap-2.5 shadow-sm">
          <Ionicons name="search-outline" size={18} color="#64748b" />
          <TextInput
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 p-0"
            placeholder="Buscar por nombre, empresa o correo..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={(v) => setSearchQuery(sanitizeText(v, 60))}
            maxLength={60}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filtros por Clasificación */}
      <View className="py-2">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CLASIFICACIONES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedFilter(item)}
                className={`px-3.5 py-1.5 rounded-full border ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 shadow-sm'
                    : 'bg-white border-slate-200'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-white' : 'text-slate-600'
                  }`}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Lista de Clientes */}
      <FlatList
        data={filteredClientes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
        ListEmptyComponent={
          loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-28 h-28 mb-3">
                <AppLottie
                  source={Animations.loading}
                  loop
                />
              </View>
              <Text className="text-sm font-medium text-slate-500">
                Cargando clientes...
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-12 px-6">
              <View className="w-48 h-40 mb-4">
                <AppLottie
                  source={Animations.clientsEmpty}
                  loop
                />
              </View>
              <Text className="text-lg font-bold text-slate-800 text-center">
                {searchQuery || selectedFilter !== 'Todos'
                  ? 'No se encontraron clientes'
                  : 'Aún no tienes clientes registrados'}
              </Text>
              <Text className="text-xs text-slate-500 text-center mt-1 mb-5">
                {searchQuery || selectedFilter !== 'Todos'
                  ? 'Intenta cambiar el término de búsqueda o el filtro seleccionado'
                  : 'Empieza a construir tu base de clientes para dar seguimiento a tus ventas'}
              </Text>
              {!searchQuery && selectedFilter === 'Todos' && (
                <Button
                  title="Agregar Primer Cliente"
                  onPress={() => router.push('/(app)/new-client')}
                  leftIcon={<Ionicons name="person-add-outline" size={16} color="#ffffff" />}
                />
              )}
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/(app)/client/${item.id}`)}
            className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center">
                  <Text className="text-lg font-bold text-blue-700">
                    {item.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-900 tracking-tight">
                    {item.nombre}
                  </Text>
                  {item.empresa ? (
                    <Text className="text-xs text-slate-500 font-medium">
                      {item.empresa}
                    </Text>
                  ) : null}
                </View>
              </View>

              <Badge label={item.clasificacion} type={item.clasificacion} />
            </View>

            {/* Datos de contacto */}
            <View className="mt-3 pt-3 border-t border-slate-50 flex-row items-center justify-between">
              <View className="gap-1 flex-1">
                {item.email ? (
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="mail-outline" size={13} color="#64748b" />
                    <Text className="text-xs text-slate-600">{item.email}</Text>
                  </View>
                ) : null}
                {item.telefono ? (
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="call-outline" size={13} color="#64748b" />
                    <Text className="text-xs text-slate-600">{item.telefono}</Text>
                  </View>
                ) : null}
              </View>

              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => setClienteAEliminar(item)}
                  className="p-2 rounded-xl bg-red-50"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>

                <View className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50">
                  <Text className="text-xs font-semibold text-slate-600">Ver</Text>
                  <Ionicons name="chevron-forward" size={14} color="#64748b" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <ConfirmDialog
        visible={clienteAEliminar != null}
        icon="person-remove-outline"
        title="¿Eliminar este cliente?"
        highlight={clienteAEliminar?.nombre}
        message="También se borrarán su historial de compras e interacciones. Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar cliente"
        cancelLabel="No, conservarlo"
        onConfirm={confirmDeleteClient}
        onCancel={() => setClienteAEliminar(null)}
      />

      <ModalFeedback
        visible={!!deleteError}
        type="error"
        title="No se pudo eliminar"
        message={deleteError}
        onClose={() => setDeleteError('')}
      />
    </View>
  );
}
