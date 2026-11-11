import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

// URL a la que Supabase devuelve al usuario tras el login con Google.
// DEBE estar en Supabase → Authentication → URL Configuration → Redirect URLs,
// si no, Supabase ignora este valor y redirige al "Site URL" (la página de Vercel).
export const getAuthRedirectUrl = () => Linking.createURL('auth/callback');

const isAuthCallbackUrl = (url: string) =>
  url.includes('auth/callback') &&
  /[#?&](access_token|code|error_description|error)=/.test(url);

// Evita procesar dos veces la misma URL (listener + arranque de la app)
const handledAuthUrls = new Set<string>();

/**
 * Extrae los tokens (flujo implícito) o el código (flujo PKCE) de la URL
 * de retorno de Supabase y crea la sesión.
 */
export async function createSessionFromUrl(url: string): Promise<{ error: Error | null }> {
  if (handledAuthUrls.has(url)) return { error: null };
  handledAuthUrls.add(url);

  const params: Record<string, string> = {};
  const queryIdx = url.indexOf('?');
  const hashIdx = url.indexOf('#');
  const parts = [
    queryIdx !== -1 ? url.substring(queryIdx + 1, hashIdx > queryIdx ? hashIdx : undefined) : '',
    hashIdx !== -1 ? url.substring(hashIdx + 1) : '',
  ];

  parts
    .join('&')
    .split('&')
    .forEach((item) => {
      const eqIdx = item.indexOf('=');
      if (eqIdx <= 0) return;
      const k = decodeURIComponent(item.substring(0, eqIdx));
      let v = decodeURIComponent(item.substring(eqIdx + 1).replace(/\+/g, ' '));
      // Supabase a veces codifica dos veces el mensaje de error
      if (/%[0-9A-F]{2}/i.test(v)) {
        try {
          v = decodeURIComponent(v);
        } catch {}
      }
      if (v) params[k] = v;
    });

  if (params.error || params.error_description) {
    return { error: new Error(params.error_description || params.error) };
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    return { error };
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    return { error };
  }

  return { error: new Error('No se recibió la sesión de Google.') };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    nombre?: string
  ) => Promise<{ error: Error | null; data?: any }>;
  signInWithGoogle: () => Promise<{ error: Error | null; cancelled?: boolean }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  sendPasswordResetEmail: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Expo Go puede reiniciar la app al volver de Google: en ese caso los
      // tokens llegan en la URL con la que se abrió la app.
      if (Platform.OS !== 'web') {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && isAuthCallbackUrl(initialUrl)) {
          const { error } = await createSessionFromUrl(initialUrl);
          if (__DEV__) console.log('[auth] Sesión desde URL inicial:', error?.message ?? 'ok');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    // Deep link de Google recibido con la app ya abierta
    const linkSubscription =
      Platform.OS !== 'web'
        ? Linking.addEventListener('url', ({ url }) => {
            if (isAuthCallbackUrl(url)) createSessionFromUrl(url);
          })
        : null;

    return () => {
      subscription.unsubscribe();
      linkSubscription?.remove();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUpWithEmail = async (email: string, password: string, nombre?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: nombre?.trim() || '',
          },
        },
      });
      if (error) return { data, error };

      // Con la confirmación de correo activa, Supabase no devuelve error si el
      // correo ya existe (para no revelar cuentas): devuelve un usuario "falso"
      // sin identidades. Ese caso significa que el correo ya está registrado.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        return { data, error: new Error('User already registered') };
      }

      return { data, error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signInWithGoogle = async (): Promise<{ error: Error | null; cancelled?: boolean }> => {
    try {
      const redirectUrl = getAuthRedirectUrl();
      if (__DEV__) console.log('[auth] Google redirectTo:', redirectUrl);

      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
          },
        });
        return { error };
      }

      // Native (iOS / Android)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) return { error };
      if (!data?.url) return { error: new Error('No se recibió URL de autenticación') };

      // En Android el navegador puede reportar "dismiss" antes de que llegue el
      // deep link con los tokens, así que escuchamos el enlace por nuestra cuenta.
      let redirectedUrl: string | null = null;
      const subscription = Linking.addEventListener('url', ({ url }) => {
        if (url.startsWith(redirectUrl)) redirectedUrl = url;
      });

      try {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (__DEV__) console.log('[auth] Google result:', res.type);

        let returnedUrl = res.type === 'success' ? res.url : null;
        for (let i = 0; !returnedUrl && i < 15; i++) {
          returnedUrl = redirectedUrl;
          if (!returnedUrl) await new Promise((resolve) => setTimeout(resolve, 200));
        }

        if (returnedUrl) return await createSessionFromUrl(returnedUrl);

        // La pantalla auth/callback pudo haber creado ya la sesión
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) return { error: null };

        // El usuario cerró el navegador o canceló el inicio de sesión
        return { error: null, cancelled: true };
      } finally {
        subscription.remove();
      }
    } catch (err: any) {
      return { error: err };
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      const redirectUrl = Linking.createURL('reset-password');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordResetEmail,
        updatePassword,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
