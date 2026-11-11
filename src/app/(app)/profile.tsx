import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { KeyboardAwareScrollView } from '@/components/ui/keyboard-aware-scroll-view';
import { ModalFeedback } from '@/components/ui/modal-feedback';
import { PasswordRequirements } from '@/components/ui/password-requirements';
import {
  LIMITS,
  sanitizePassword,
  translateError,
  validatePassword,
  validatePasswordConfirmation,
} from '@/lib/validation';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updatePassword, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string | null; confirm?: string | null }>({});
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const provider = user?.app_metadata?.provider || 'email';
  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Emprendedor';

  const handleChangePassword = async () => {
    const errors = {
      password: validatePassword(password),
      confirm: validatePasswordConfirmation(password, confirmPassword),
    };
    setFieldErrors(errors);
    if (errors.password || errors.confirm) {
      setErrorMessage('');
      return;
    }

    setErrorMessage('');
    setLoadingPassword(true);

    const { error } = await updatePassword(password);
    setLoadingPassword(false);

    if (error) {
      setErrorMessage(translateError(error, 'No se pudo actualizar la contraseña.'));
    } else {
      setPassword('');
      setConfirmPassword('');
      setShowSuccessModal(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowSignOutConfirm(false);
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-1">
        {/* Header: se separa de la barra de estado / notch con el inset superior */}
        <View
          className="px-5 pb-4 bg-white border-b border-slate-100"
          style={{ paddingTop: insets.top + 16 }}>
          <Text className="text-xl font-extrabold text-slate-900 tracking-tight">
            Mi Perfil y Seguridad
          </Text>
        </View>

        <KeyboardAwareScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {/* Tarjeta de Información de Usuario */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm items-center">
            <View className="w-20 h-20 rounded-full bg-blue-100 border-2 border-blue-200 items-center justify-center mb-3">
              <Text className="text-3xl font-extrabold text-blue-700">
                {fullName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text className="text-lg font-bold text-slate-900 text-center">
              {fullName}
            </Text>

            <Text className="text-xs text-slate-500 text-center mt-0.5">
              {user?.email}
            </Text>

            <View className="flex-row items-center gap-1.5 mt-3 px-3 py-1 bg-slate-100 rounded-full">
              <Ionicons
                name={provider === 'google' ? 'logo-google' : 'mail-outline'}
                size={13}
                color="#64748b"
              />
              <Text className="text-[11px] font-semibold text-slate-600 capitalize">
                Autenticado con {provider}
              </Text>
            </View>
          </View>

          {/* Sección de Cambio de Contraseña (Requisito Parte 2) */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="p-2 bg-blue-50 rounded-xl">
                <Ionicons name="key-outline" size={18} color="#2563eb" />
              </View>
              <View>
                <Text className="text-base font-bold text-slate-900">
                  Cambiar Contraseña
                </Text>
                <Text className="text-xs text-slate-400">
                  Actualiza tu contraseña de acceso
                </Text>
              </View>
            </View>

            {errorMessage ? (
              <View className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-3 items-center gap-1">
                <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
                <Text className="text-xs text-red-600 font-medium text-center">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <Input
              label="Nueva Contraseña"
              placeholder={`Mínimo ${LIMITS.password.min} caracteres`}
              value={password}
              onChangeText={(v) => {
                setPassword(sanitizePassword(v));
                setFieldErrors((prev) => ({ ...prev, password: null }));
              }}
              maxLength={LIMITS.password.max}
              isPassword
              autoComplete="new-password"
              error={fieldErrors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={17} color="#64748b" />}
            />

            <PasswordRequirements password={password} />

            <Input
              label="Confirmar Nueva Contraseña"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(sanitizePassword(v));
                setFieldErrors((prev) => ({ ...prev, confirm: null }));
              }}
              maxLength={LIMITS.password.max}
              isPassword
              autoComplete="new-password"
              error={fieldErrors.confirm}
              leftIcon={<Ionicons name="shield-checkmark-outline" size={17} color="#64748b" />}
            />

            <Button
              title="Actualizar Contraseña"
              onPress={handleChangePassword}
              isLoading={loadingPassword}
              className="mt-1"
            />
          </View>

          {/* Botón de Cerrar Sesión */}
          <Button
            title="Cerrar Sesión"
            variant="danger"
            onPress={() => setShowSignOutConfirm(true)}
            leftIcon={<Ionicons name="log-out-outline" size={18} color="#ffffff" />}
          />
        </KeyboardAwareScrollView>
      </View>

      <ModalFeedback
        visible={showSuccessModal}
        title="Contraseña Modificada"
        message="Tu contraseña se ha actualizado correctamente."
        onClose={() => setShowSuccessModal(false)}
      />

      <ConfirmDialog
        visible={showSignOutConfirm}
        icon="log-out-outline"
        title="¿Cerrar tu sesión?"
        highlight={user?.email ?? undefined}
        message="Tendrás que volver a ingresar tu correo y contraseña para ver tus clientes y ventas."
        confirmLabel="Sí, cerrar sesión"
        cancelLabel="Seguir conectado"
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </View>
  );
}
