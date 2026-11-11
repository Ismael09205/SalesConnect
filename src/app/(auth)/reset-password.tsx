import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyboardAwareScrollView } from '@/components/ui/keyboard-aware-scroll-view';
import { AppLottie } from '@/components/ui/lottie-view';
import { ModalFeedback } from '@/components/ui/modal-feedback';
import { PasswordRequirements } from '@/components/ui/password-requirements';
import {
  LIMITS,
  sanitizePassword,
  translateError,
  validatePassword,
  validatePasswordConfirmation,
} from '@/lib/validation';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string | null; confirm?: string | null }>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleUpdate = async () => {
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
    setLoading(true);

    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      setErrorMessage(translateError(error, 'No se pudo actualizar la contraseña.'));
    } else {
      setShowSuccessModal(true);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-6 py-10 justify-center">

        <View className="items-center mb-6">
          <View className="w-24 h-24 mb-2">
            <AppLottie
              source={require('../../../assets/animations/auth-security.json')}
              loop
            />
          </View>
          <Text className="text-2xl font-extrabold text-slate-900 tracking-tight text-center">
            Nueva Contraseña
          </Text>
          <Text className="text-sm text-slate-500 text-center mt-1">
            Ingresa tu nueva clave de acceso
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

        <View className="w-full">
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
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#64748b" />}
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
            leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color="#64748b" />}
          />

          <Button
            title="Guardar Nueva Contraseña"
            onPress={handleUpdate}
            isLoading={loading}
            className="w-full mt-2 mb-4"
          />
        </View>
      </KeyboardAwareScrollView>

      <ModalFeedback
        visible={showSuccessModal}
        title="Contraseña Actualizada"
        message="Tu clave de acceso ha sido cambiada correctamente. Ya puedes ingresar con tu nueva contraseña."
        onClose={() => {
          setShowSuccessModal(false);
          router.replace('/(auth)/login');
        }}
      />
    </View>
  );
}
