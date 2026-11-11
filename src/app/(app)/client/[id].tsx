import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import {
  supabase,
  Cliente,
  Compra,
  Interaccion,
  ClasificacionCliente,
  EstadoCompra,
  TipoInteraccion,
} from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLottie } from '@/components/ui/lottie-view';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { KeyboardAwareScrollView } from '@/components/ui/keyboard-aware-scroll-view';
import { ModalFeedback } from '@/components/ui/modal-feedback';
import { Animations } from '@/constants/animations';
import {
  ClientFormErrors,
  hasErrors,
  LIMITS,
  sanitizeAmount,
  sanitizeEmail,
  sanitizeLongText,
  sanitizeName,
  sanitizePhone,
  sanitizeText,
  translateError,
  validateAmount,
  validateClientForm,
  validateOptionalText,
} from '@/lib/validation';

type ConfirmAction =
  | { kind: 'cliente' }
  | { kind: 'compra'; compra: Compra }
  | { kind: 'interaccion'; interaccion: Interaccion };

const CLASIFICACIONES: ClasificacionCliente[] = [
  'Lead',
  'Prospecto',
  'Cliente Frecuente',
  'Cliente VIP',
  'Inactivo',
];

const ESTADOS_COMPRA: EstadoCompra[] = ['Pagado', 'Pendiente', 'Cancelado'];
const TIPOS_INTERACCION: TipoInteraccion[] = ['WhatsApp', 'Llamada', 'Reunión', 'Correo', 'Visita'];

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'info' | 'compras' | 'interacciones'>('info');
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [interacciones, setInteracciones] = useState<Interaccion[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de edición del cliente
  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [clasificacion, setClasificacion] = useState<ClasificacionCliente>('Lead');
  const [notas, setNotas] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Estados modal nueva compra
  const [modalCompraVisible, setModalCompraVisible] = useState(false);
  const [montoCompra, setMontoCompra] = useState('');
  const [descCompra, setDescCompra] = useState('');
  const [estadoCompra, setEstadoCompra] = useState<EstadoCompra>('Pagado');

  // Estados modal nueva interacción
  const [modalInteraccionVisible, setModalInteraccionVisible] = useState(false);
  const [tipoInteraccion, setTipoInteraccion] = useState<TipoInteraccion>('WhatsApp');
  const [resumenInteraccion, setResumenInteraccion] = useState('');
  const [proximoSeguimiento, setProximoSeguimiento] = useState('');

  // Modal feedback
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLottie, setFeedbackLottie] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  // Validaciones y confirmaciones
  const [loadError, setLoadError] = useState('');
  const [clientErrors, setClientErrors] = useState<ClientFormErrors>({});
  const [compraErrors, setCompraErrors] = useState<{ monto?: string | null; descripcion?: string | null }>({});
  const [interaccionErrors, setInteraccionErrors] = useState<{ resumen?: string | null; seguimiento?: string | null }>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const showSuccess = (title: string, message: string) => {
    setFeedbackType('success');
    setFeedbackLottie(null);
    setFeedbackTitle(title);
    setFeedbackMessage(message);
    setShowFeedback(true);
  };

  const showError = (title: string, error: unknown, fallback: string) => {
    setFeedbackType('error');
    setFeedbackLottie(null);
    setFeedbackTitle(title);
    setFeedbackMessage(translateError(error, fallback));
    setShowFeedback(true);
  };

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      // 1. Cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (clienteError) {
        setLoadError(
          translateError(clienteError, 'No se encontró la información de este cliente. Puede que haya sido eliminado.')
        );
        return;
      }

      setCliente(clienteData);
      setNombre(clienteData.nombre);
      setEmail(clienteData.email || '');
      setTelefono(clienteData.telefono || '');
      setEmpresa(clienteData.empresa || '');
      setClasificacion(clienteData.clasificacion);
      setNotas(clienteData.notas || '');

      // 2. Compras
      const { data: comprasData } = await supabase
        .from('compras')
        .select('*')
        .eq('cliente_id', id)
        .order('fecha', { ascending: false });

      setCompras(comprasData || []);

      // 3. Interacciones
      const { data: interaccionesData } = await supabase
        .from('interacciones')
        .select('*')
        .eq('cliente_id', id)
        .order('fecha_interaccion', { ascending: false });

      setInteracciones(interaccionesData || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Actualizar Cliente
  const handleUpdateCliente = async () => {
    const errors = validateClientForm({ nombre, email, telefono, empresa, notas });
    setClientErrors(errors);
    if (hasErrors(errors)) return;

    setSaveLoading(true);
    const { error } = await supabase
      .from('clientes')
      .update({
        nombre: nombre.trim(),
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        empresa: empresa.trim() || null,
        clasificacion,
        notas: notas.trim() || null,
      })
      .eq('id', id);

    setSaveLoading(false);

    if (error) {
      showError('No se guardaron los cambios', error, 'No se pudieron actualizar los datos del cliente.');
    } else {
      setIsEditing(false);
      showSuccess('Cliente Actualizado', 'Los datos del cliente han sido actualizados correctamente.');
      fetchData();
    }
  };

  // Ejecuta la eliminación confirmada en el diálogo (cliente, venta o interacción)
  const handleConfirmDelete = async () => {
    if (!confirmAction) return;

    if (confirmAction.kind === 'cliente') {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      setConfirmAction(null);
      if (error) {
        showError('No se pudo eliminar', error, 'No se pudo eliminar el cliente. Inténtalo de nuevo.');
      } else {
        router.replace('/(app)');
      }
      return;
    }

    const { error } =
      confirmAction.kind === 'compra'
        ? await supabase.from('compras').delete().eq('id', confirmAction.compra.id)
        : await supabase.from('interacciones').delete().eq('id', confirmAction.interaccion.id);

    setConfirmAction(null);
    if (error) {
      showError('No se pudo eliminar', error, 'No se pudo eliminar el registro. Inténtalo de nuevo.');
    } else {
      fetchData();
    }
  };

  // Crear Compra
  const handleSaveCompra = async () => {
    const errors = {
      monto: validateAmount(montoCompra),
      descripcion: validateOptionalText(descCompra, 'La descripción', LIMITS.descripcion, true),
    };
    setCompraErrors(errors);
    if (hasErrors(errors)) return;
    const numMonto = Number(montoCompra);

    if (!user) return;

    const { error } = await supabase.from('compras').insert([
      {
        cliente_id: id,
        user_id: user.id,
        monto: numMonto,
        descripcion: descCompra.trim(),
        estado: estadoCompra,
        fecha: new Date().toISOString(),
      },
    ]);

    if (error) {
      setModalCompraVisible(false);
      showError('No se registró la venta', error, 'No se pudo registrar la venta. Inténtalo de nuevo.');
    } else {
      setModalCompraVisible(false);
      setMontoCompra('');
      setDescCompra('');
      showSuccess('¡Venta Registrada!', 'La compra y crecimiento en ventas han sido registrados exitosamente.');
      fetchData();
    }
  };

  // Crear Interacción
  const handleSaveInteraccion = async () => {
    const errors = {
      resumen: validateOptionalText(resumenInteraccion, 'El resumen', LIMITS.resumen, true),
      seguimiento: validateOptionalText(proximoSeguimiento, 'El próximo seguimiento', LIMITS.seguimiento),
    };
    setInteraccionErrors(errors);
    if (hasErrors(errors)) return;

    if (!user) return;

    const { error } = await supabase.from('interacciones').insert([
      {
        cliente_id: id,
        user_id: user.id,
        tipo: tipoInteraccion,
        resumen: resumenInteraccion.trim(),
        proximo_seguimiento: proximoSeguimiento.trim() || null,
        fecha_interaccion: new Date().toISOString(),
      },
    ]);

    if (error) {
      setModalInteraccionVisible(false);
      showError('No se guardó la interacción', error, 'No se pudo guardar la interacción. Inténtalo de nuevo.');
    } else {
      setModalInteraccionVisible(false);
      setResumenInteraccion('');
      setProximoSeguimiento('');
      showSuccess('Interacción Guardada', 'La bitácora de seguimiento fue actualizada con éxito.');
      fetchData();
    }
  };

  if (loadError) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-8">
        <View className="w-16 h-16 rounded-full bg-red-50 border-4 border-red-100 items-center justify-center mb-4">
          <Ionicons name="person-outline" size={28} color="#ef4444" />
        </View>
        <Text className="text-lg font-bold text-slate-900 text-center">Cliente no disponible</Text>
        <Text className="text-sm text-slate-500 text-center mt-1 mb-6">{loadError}</Text>
        <Button title="Volver a mis clientes" onPress={() => router.replace('/(app)')} className="w-full" />
      </View>
    );
  }

  if (loading || !cliente) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <View className="w-28 h-28 mb-3">
          <AppLottie
            source={Animations.loading}
            loop
          />
        </View>
        <Text className="text-sm font-medium text-slate-500">
          Cargando información del cliente...
        </Text>
      </View>
    );
  }

  const totalClienteCompras = compras.reduce((acc, c) => acc + (Number(c.monto) || 0), 0);

  return (
    <View className="flex-1 bg-slate-50">
      {/* Barra Superior: se separa de la barra de estado / notch con el inset superior */}
      <View
        className="bg-white border-b border-slate-100 px-4 pb-3 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-xl bg-slate-50"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>

        <Text className="text-base font-bold text-slate-800" numberOfLines={1}>
          {cliente.nombre}
        </Text>

        <TouchableOpacity
          onPress={() => setConfirmAction({ kind: 'cliente' })}
          className="p-2 rounded-xl bg-red-50"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Pestañas de Navegación del Detalle */}
      <View className="bg-white flex-row border-b border-slate-200">
        <TouchableOpacity
          onPress={() => setActiveTab('info')}
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === 'info' ? 'border-blue-600' : 'border-transparent'
          }`}>
          <Text
            className={`text-xs font-bold ${
              activeTab === 'info' ? 'text-blue-600' : 'text-slate-500'
            }`}>
            Información y Notas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('compras')}
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === 'compras' ? 'border-blue-600' : 'border-transparent'
          }`}>
          <Text
            className={`text-xs font-bold ${
              activeTab === 'compras' ? 'text-blue-600' : 'text-slate-500'
            }`}>
            Compras ({compras.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('interacciones')}
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === 'interacciones' ? 'border-blue-600' : 'border-transparent'
          }`}>
          <Text
            className={`text-xs font-bold ${
              activeTab === 'interacciones' ? 'text-blue-600' : 'text-slate-500'
            }`}>
            Interacciones ({interacciones.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENIDO PESTAÑA: INFORMACIÓN Y NOTAS */}
      {activeTab === 'info' && (
        <KeyboardAwareScrollView contentContainerStyle={{ padding: 20 }}>
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Badge label={cliente.clasificacion} type={cliente.clasificacion} size="md" />
              <TouchableOpacity
                onPress={() => {
                  setIsEditing(!isEditing);
                  setClientErrors({});
                }}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50">
                <Ionicons
                  name={isEditing ? 'close-outline' : 'create-outline'}
                  size={16}
                  color="#2563eb"
                />
                <Text className="text-xs font-bold text-blue-600">
                  {isEditing ? 'Cancelar' : 'Editar Datos'}
                </Text>
              </TouchableOpacity>
            </View>

            {isEditing ? (
              <View>
                <Input
                  label="Nombre Completo *"
                  value={nombre}
                  onChangeText={(v) => {
                    setNombre(sanitizeName(v));
                    setClientErrors((prev) => ({ ...prev, nombre: null }));
                  }}
                  maxLength={LIMITS.nombre.max}
                  autoCapitalize="words"
                  error={clientErrors.nombre}
                />
                <Input
                  label="Empresa"
                  value={empresa}
                  onChangeText={(v) => {
                    setEmpresa(sanitizeText(v, LIMITS.empresa.max));
                    setClientErrors((prev) => ({ ...prev, empresa: null }));
                  }}
                  maxLength={LIMITS.empresa.max}
                  autoCapitalize="words"
                  error={clientErrors.empresa}
                />
                <Input
                  label="Correo Electrónico"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(sanitizeEmail(v));
                    setClientErrors((prev) => ({ ...prev, email: null }));
                  }}
                  maxLength={LIMITS.email.max}
                  keyboardType="email-address"
                  error={clientErrors.email}
                />
                <Input
                  label="Teléfono"
                  value={telefono}
                  onChangeText={(v) => {
                    setTelefono(sanitizePhone(v));
                    setClientErrors((prev) => ({ ...prev, telefono: null }));
                  }}
                  maxLength={LIMITS.telefono.max + 5}
                  keyboardType="phone-pad"
                  error={clientErrors.telefono}
                />

                <Text className="text-xs font-semibold text-slate-700 mb-2">
                  Clasificación
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {CLASIFICACIONES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setClasificacion(c)}
                      className={`px-3 py-1.5 rounded-full border ${
                        clasificacion === c
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                      <Text
                        className={`text-xs font-semibold ${
                          clasificacion === c ? 'text-white' : 'text-slate-700'
                        }`}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input
                  label="Notas y Observaciones"
                  value={notas}
                  onChangeText={(v) => {
                    setNotas(sanitizeLongText(v, LIMITS.notas.max));
                    setClientErrors((prev) => ({ ...prev, notas: null }));
                  }}
                  maxLength={LIMITS.notas.max}
                  showCount
                  autoCapitalize="sentences"
                  error={clientErrors.notas}
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />

                <Button
                  title="Guardar Cambios"
                  onPress={handleUpdateCliente}
                  isLoading={saveLoading}
                />
              </View>
            ) : (
              <View className="gap-3.5">
                <View>
                  <Text className="text-xs text-slate-400 font-semibold uppercase">
                    Nombre
                  </Text>
                  <Text className="text-base font-bold text-slate-900 mt-0.5">
                    {cliente.nombre}
                  </Text>
                </View>

                {cliente.empresa && (
                  <View>
                    <Text className="text-xs text-slate-400 font-semibold uppercase">
                      Empresa
                    </Text>
                    <Text className="text-sm font-semibold text-slate-700 mt-0.5">
                      {cliente.empresa}
                    </Text>
                  </View>
                )}

                <View className="flex-row gap-6">
                  {cliente.email && (
                    <View className="flex-1">
                      <Text className="text-xs text-slate-400 font-semibold uppercase">
                        Correo
                      </Text>
                      <Text className="text-sm text-slate-700 mt-0.5">
                        {cliente.email}
                      </Text>
                    </View>
                  )}
                  {cliente.telefono && (
                    <View className="flex-1">
                      <Text className="text-xs text-slate-400 font-semibold uppercase">
                        Teléfono
                      </Text>
                      <Text className="text-sm text-slate-700 mt-0.5">
                        {cliente.telefono}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="pt-3 border-t border-slate-100">
                  <Text className="text-xs text-slate-400 font-semibold uppercase">
                    Notas y Observaciones
                  </Text>
                  <Text className="text-sm text-slate-700 mt-1 leading-relaxed">
                    {cliente.notas || 'Sin notas registradas para este cliente.'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </KeyboardAwareScrollView>
      )}

      {/* CONTENIDO PESTAÑA: HISTORIAL DE COMPRAS */}
      {activeTab === 'compras' && (
        <View className="flex-1">
          <View className="px-5 py-3 flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-slate-500 font-medium">Total Facturado</Text>
              <Text className="text-lg font-bold text-slate-900">
                ${totalClienteCompras.toFixed(2)}
              </Text>
            </View>
            <Button
              title="Registrar Venta"
              size="sm"
              onPress={() => setModalCompraVisible(true)}
              leftIcon={<Ionicons name="add" size={16} color="#ffffff" />}
            />
          </View>

          <FlatList
            data={compras}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, gap: 10, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden items-center pb-6">
                {/* Banda con círculos de color detrás de la animación para darle profundidad */}
                <View className="w-full items-center justify-center pt-5 pb-3 bg-blue-50 overflow-hidden">
                  <View className="absolute w-56 h-56 rounded-full bg-blue-100 -top-20 -left-12" />
                  <View className="absolute w-40 h-40 rounded-full bg-emerald-100 -bottom-16 -right-8" />
                  <View className="absolute w-16 h-16 rounded-full bg-white/70 top-4 right-10" />
                  <View className="w-[92%]" style={{ aspectRatio: 838 / 575 }}>
                    <AppLottie source={Animations.salesGrowth} loop />
                  </View>
                </View>
                <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-100 shadow-sm -mt-3.5">
                  <Ionicons name="trending-up" size={13} color="#059669" />
                  <Text className="text-[11px] font-bold text-emerald-700">Listo para crecer</Text>
                </View>
                <Text className="text-base font-bold text-slate-800 mt-3 px-5 text-center">
                  Aún no hay ventas con este cliente
                </Text>
                <Text className="text-xs text-slate-500 text-center mt-1 mb-4 px-6">
                  Registra su primera compra para empezar a medir su crecimiento
                </Text>
                <Button
                  title="Registrar primera venta"
                  size="sm"
                  onPress={() => setModalCompraVisible(true)}
                  leftIcon={<Ionicons name="add" size={16} color="#ffffff" />}
                />
              </View>
            }
            renderItem={({ item }) => (
              <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-bold text-slate-900">
                    ${Number(item.monto).toFixed(2)}
                  </Text>
                  <Text className="text-xs font-semibold text-slate-700 mt-0.5">
                    {item.descripcion}
                  </Text>
                  <Text className="text-[11px] text-slate-400 mt-1">
                    {new Date(item.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                <View className="items-end gap-2">
                  <Badge label={item.estado} type={item.estado} />
                  <TouchableOpacity
                    onPress={() => setConfirmAction({ kind: 'compra', compra: item })}
                    className="p-1.5 rounded-lg bg-red-50">
                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* CONTENIDO PESTAÑA: SEGUIMIENTO E INTERACCIONES */}
      {activeTab === 'interacciones' && (
        <View className="flex-1">
          <View className="px-5 py-3 flex-row items-center justify-between">
            <Text className="text-xs text-slate-500 font-medium">
              Bitácora de Contacto
            </Text>
            <Button
              title="Nueva Interacción"
              size="sm"
              onPress={() => setModalInteraccionVisible(true)}
              leftIcon={<Ionicons name="chatbubble-ellipses-outline" size={15} color="#ffffff" />}
            />
          </View>

          <FlatList
            data={interacciones}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, gap: 10, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-12">
                <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
                <Text className="text-sm font-semibold text-slate-600 mt-2">
                  No hay interacciones registradas
                </Text>
                <Text className="text-xs text-slate-400 mt-1">
                  Registra llamadas, correos o reuniones sostenidas
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons
                      name={
                        item.tipo === 'WhatsApp'
                          ? 'logo-whatsapp'
                          : item.tipo === 'Llamada'
                          ? 'call'
                          : item.tipo === 'Correo'
                          ? 'mail'
                          : 'calendar'
                      }
                      size={15}
                      color="#2563eb"
                    />
                    <Text className="text-xs font-bold text-blue-600">
                      {item.tipo}
                    </Text>
                  </View>
                  <Text className="text-[11px] text-slate-400">
                    {new Date(item.fecha_interaccion).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <Text className="text-sm text-slate-800 leading-relaxed mb-2">
                  {item.resumen}
                </Text>

                <View className="flex-row items-center justify-between pt-2 border-t border-slate-50">
                  {item.proximo_seguimiento ? (
                    <Text className="text-[11px] text-amber-700 font-medium">
                      Próximo: {item.proximo_seguimiento}
                    </Text>
                  ) : (
                    <View />
                  )}
                  <TouchableOpacity
                    onPress={() => setConfirmAction({ kind: 'interaccion', interaccion: item })}
                    className="p-1 rounded-lg bg-red-50">
                    <Ionicons name="trash-outline" size={13} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* MODAL REGISTRAR COMPRA */}
      <Modal
        visible={modalCompraVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCompraVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900">
                Registrar Venta / Compra
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalCompraVisible(false);
                  setCompraErrors({});
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Input
              label="Monto ($) *"
              placeholder="0.00"
              value={montoCompra}
              onChangeText={(v) => {
                setMontoCompra(sanitizeAmount(v));
                setCompraErrors((prev) => ({ ...prev, monto: null }));
              }}
              maxLength={10}
              keyboardType="decimal-pad"
              hint={`Máximo $${LIMITS.monto.max.toLocaleString('es-ES')}, hasta 2 decimales`}
              error={compraErrors.monto}
            />

            <Input
              label="Descripción *"
              placeholder="Ej. Servicio de consultoría mensual"
              value={descCompra}
              onChangeText={(v) => {
                setDescCompra(sanitizeText(v, LIMITS.descripcion.max));
                setCompraErrors((prev) => ({ ...prev, descripcion: null }));
              }}
              maxLength={LIMITS.descripcion.max}
              showCount
              autoCapitalize="sentences"
              error={compraErrors.descripcion}
            />

            <Text className="text-xs font-semibold text-slate-700 mb-2">Estado</Text>
            <View className="flex-row gap-2 mb-6">
              {ESTADOS_COMPRA.map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setEstadoCompra(e)}
                  className={`px-3 py-1.5 rounded-full border ${
                    estadoCompra === e
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                  <Text
                    className={`text-xs font-semibold ${
                      estadoCompra === e ? 'text-white' : 'text-slate-700'
                    }`}>
                    {e}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Guardar Venta" onPress={handleSaveCompra} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL REGISTRAR INTERACCIÓN */}
      <Modal
        visible={modalInteraccionVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalInteraccionVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900">
                Registrar Interacción
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalInteraccionVisible(false);
                  setInteraccionErrors({});
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-semibold text-slate-700 mb-2">
              Tipo de Contacto
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {TIPOS_INTERACCION.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTipoInteraccion(t)}
                  className={`px-3 py-1.5 rounded-full border ${
                    tipoInteraccion === t
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                  <Text
                    className={`text-xs font-semibold ${
                      tipoInteraccion === t ? 'text-white' : 'text-slate-700'
                    }`}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Resumen de la Interacción *"
              placeholder="Detalla lo conversado, acuerdos o dudas del cliente..."
              value={resumenInteraccion}
              onChangeText={(v) => {
                setResumenInteraccion(sanitizeLongText(v, LIMITS.resumen.max));
                setInteraccionErrors((prev) => ({ ...prev, resumen: null }));
              }}
              maxLength={LIMITS.resumen.max}
              showCount
              autoCapitalize="sentences"
              error={interaccionErrors.resumen}
              multiline
              numberOfLines={3}
              style={{ minHeight: 70, textAlignVertical: 'top' }}
            />

            <Input
              label="Próximo Seguimiento (Opcional)"
              placeholder="Ej. 15 de Noviembre o 'Llamar el viernes'"
              value={proximoSeguimiento}
              onChangeText={(v) => {
                setProximoSeguimiento(sanitizeText(v, LIMITS.seguimiento.max));
                setInteraccionErrors((prev) => ({ ...prev, seguimiento: null }));
              }}
              maxLength={LIMITS.seguimiento.max}
              autoCapitalize="sentences"
              error={interaccionErrors.seguimiento}
            />

            <Button title="Guardar Interacción" onPress={handleSaveInteraccion} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL FEEDBACK CON LOTTIE */}
      <ModalFeedback
        visible={showFeedback}
        title={feedbackTitle}
        message={feedbackMessage}
        type={feedbackType}
        lottieSource={feedbackLottie}
        onClose={() => setShowFeedback(false)}
      />

      {/* CONFIRMACIÓN DE ELIMINACIÓN (cliente, venta o interacción) */}
      <ConfirmDialog
        visible={confirmAction != null}
        {...(confirmAction?.kind === 'compra'
          ? {
              icon: 'receipt-outline' as const,
              title: '¿Eliminar esta venta?',
              highlight: `$${Number(confirmAction.compra.monto).toFixed(2)} · ${confirmAction.compra.descripcion}`,
              message: 'El total facturado de este cliente se recalculará sin esta venta.',
              confirmLabel: 'Sí, eliminar venta',
              cancelLabel: 'Conservar venta',
            }
          : confirmAction?.kind === 'interaccion'
          ? {
              icon: 'chatbubble-ellipses-outline' as const,
              title: '¿Eliminar esta interacción?',
              highlight: `${confirmAction.interaccion.tipo} · ${new Date(
                confirmAction.interaccion.fecha_interaccion
              ).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`,
              message: 'Se quitará de la bitácora de contacto de este cliente.',
              confirmLabel: 'Sí, eliminar registro',
              cancelLabel: 'Conservar registro',
            }
          : {
              icon: 'person-remove-outline' as const,
              title: '¿Eliminar este cliente?',
              highlight: cliente.nombre,
              message:
                'También se borrarán sus compras e interacciones registradas. Esta acción no se puede deshacer.',
              confirmLabel: 'Sí, eliminar cliente',
              cancelLabel: 'No, conservarlo',
            })}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmAction(null)}
      />
    </View>
  );
}
