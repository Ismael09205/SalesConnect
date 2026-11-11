import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/auth-context';

// Pantalla a la que vuelve Supabase tras el login con Google (auth/callback).
// La sesión la crea el AuthProvider a partir de la URL; aquí solo esperamos.
export default function AuthCallbackScreen() {
  const { session, isLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Si no llega ninguna sesión, volver al login
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoading && session) return <Redirect href="/(app)" />;
  if (timedOut) return <Redirect href="/(auth)/login" />;

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}
