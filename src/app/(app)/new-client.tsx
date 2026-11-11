import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { supabase, ClasificacionCliente } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyboardAwareScrollView } from '@/components/ui/keyboard-aware-scroll-view';
import { AppLottie } from '@/components/ui/lottie-view';
import { ModalFeedback } from '@/components/ui/modal-feedback';
import { Animations } from '@/constants/animations';
import {
  ClientFormErrors,
  hasErrors,
  LIMITS,
  sanitizeEmail,
  sanitizeLongText,
  sanitizeName,
  sanitizePhone,
  sanitizeText,
  translateError,
  validateClientForm,
} from '@/lib/validation';

const CLASIFICACIONES: ClasificacionCliente[] = [
  'Lead',
  'Prospecto',
  'Cliente Frecuente',
  'Cliente VIP',
  'Inactivo',
];

export default function NewClientScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [clasificacion, setClasificacion] = useState<ClasificacionCliente>('Lead');
  const [notas, setNotas] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ClientFormErrors>({});

  const clearError = (field: keyof ClientFormErrors) =>
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSave = async () => {
    const errors = validateClientForm({ nombre, email, telefono, empresa, notas });
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      setErrorMessage('Revisa los campos marcados en rojo.');
      return;
    }

    if (!user) {
      setErrorMessage('Tu sesión expiró. Vuelve a iniciar sesión.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    const { error } = await supabase.from('clientes').insert([
      {
        user_id: user.id,
        nombre: nombre.trim(),
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        empresa: empresa.trim() || null,
        clasificacion,
        notas: notas.trim() || null,
      },
    ]);

    setLoading(false);

    if (error) {
      setErrorMessage(translateError(error, 'No se pudo guardar el cliente. Inténtalo de nuevo.'));
    } else {
      setShowSuccessModal(true);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header: se separa de la barra de estado / notch con el inset superior */}
        <View
          style={{ paddingTop: insets.top + 16 }}
          className="px-5 pb-3 border-b border-slate-100 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-slate-900">
            Registrar Nuevo Cliente
          </Text>
        </View>

        <KeyboardAwareScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

          {/* Animación Lottie: Team Work */}
          <View className="items-center mb-4">
            <View className="w-40 h-32">
              <AppLottie
                source={Animations.teamWork}
                loop
              />
            </View>
            <Text className="text-xs text-slate-500 font-medium text-center mt-1">
              Construye relaciones sólidas y colaborativas con tus clientes
            </Text>
          </View>

          {errorMessage ? (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 items-center gap-1">
              <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
              <Text className="text-xs text-red-600 font-medium text-center">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <Input
            label="Nombre Completo / Contacto *"
            placeholder="Ej. Ana Morales"
            value={nombre}
            onChangeText={(v) => {
              setNombre(sanitizeName(v));
              clearError('nombre');
            }}
            maxLength={LIMITS.nombre.max}
            autoCapitalize="words"
            hint="Solo letras y espacios"
            error={fieldErrors.nombre}
            leftIcon={<Ionicons name="person-outline" size={18} color="#64748b" />}
          />

          <Input
            label="Empresa / Negocio (Opcional)"
            placeholder="Ej. Soluciones Tech S.A."
            value={empresa}
            onChangeText={(v) => {
              setEmpresa(sanitizeText(v, LIMITS.empresa.max));
              clearError('empresa');
            }}
            maxLength={LIMITS.empresa.max}
            autoCapitalize="words"
            error={fieldErrors.empresa}
            leftIcon={<Ionicons name="business-outline" size={18} color="#64748b" />}
          />

          <Input
            label="Correo Electrónico"
            placeholder="cliente@correo.com"
            value={email}
            onChangeText={(v) => {
              setEmail(sanitizeEmail(v));
              clearError('email');
            }}
            maxLength={LIMITS.email.max}
            error={fieldErrors.email}
            keyboardType="email-address"
            autoComplete="email"
            leftIcon={<Ionicons name="mail-outline" size={18} color="#64748b" />}
          />

          <Input
            label="Teléfono / WhatsApp"
            placeholder="+593 99 999 9999"
            value={telefono}
            onChangeText={(v) => {
              setTelefono(sanitizePhone(v));
              clearError('telefono');
            }}
            maxLength={LIMITS.telefono.max + 5}
            error={fieldErrors.telefono}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={18} color="#64748b" />}
          />

          {/* Clasificación de Cliente */}
          <View className="w-full mb-4">
            <Text className="text-xs font-semibold text-slate-700 tracking-wide mb-2">
              Clasificación de Cliente
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CLASIFICACIONES.map((c) => {
                const isSelected = clasificacion === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setClasificacion(c)}
                    className={`px-3 py-1.5 rounded-full border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-white' : 'text-slate-700'
                      }`}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notas y observaciones */}
          <Input
            label="Notas y Observaciones"
            placeholder="Detalles sobre intereses del cliente, requerimientos, preferencias..."
            value={notas}
            onChangeText={(v) => {
              setNotas(sanitizeLongText(v, LIMITS.notas.max));
              clearError('notas');
            }}
            maxLength={LIMITS.notas.max}
            showCount
            autoCapitalize="sentences"
            error={fieldErrors.notas}
            multiline
            numberOfLines={4}
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />

          <Button
            title="Guardar Cliente"
            onPress={handleSave}
            isLoading={loading}
            className="w-full mt-2"
          />
        </KeyboardAwareScrollView>
      </View>

      <ModalFeedback
        visible={showSuccessModal}
        title="Cliente Guardado"
        message="El cliente se guardó correctamente y ya aparece en tu lista."
        onClose={() => {
          setShowSuccessModal(false);
          setNombre('');
          setEmail('');
          setTelefono('');
          setEmpresa('');
          setNotas('');
          setClasificacion('Lead');
          setFieldErrors({});
          router.replace('/(app)');
        }}
      />
    </View>
  );
}
