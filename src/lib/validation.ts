// Reglas de validación compartidas por todos los formularios.
// Los "sanitize*" se usan en onChangeText para impedir escribir caracteres no permitidos;
// los "validate*" devuelven un mensaje de error en español o null si el valor es válido.

export const LIMITS = {
  nombre: { min: 3, max: 60 },
  email: { max: 100 },
  password: { min: 8, max: 64 },
  empresa: { min: 2, max: 80 },
  telefono: { min: 7, max: 15 }, // dígitos, sin contar "+" ni espacios
  notas: { max: 500 },
  descripcion: { min: 3, max: 120 },
  monto: { max: 1_000_000 },
  resumen: { min: 5, max: 500 },
  seguimiento: { max: 80 },
} as const;

// Letras (incluye tildes, ñ y ü) y espacios
const NAME_ALLOWED = /[^A-Za-zÁÉÍÓÚáéíóúÑñÜü ]/g;
// Letras, números, espacios y puntuación básica
const TEXT_ALLOWED = /[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,\-]/g;
// Igual que TEXT_ALLOWED más signos habituales en notas y saltos de línea
const LONG_TEXT_ALLOWED = /[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,\-¿?¡!:;()\n]/g;
const EMAIL_ALLOWED = /[^A-Za-z0-9._%+\-@]/g;

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/** Evita espacios al inicio y espacios dobles mientras se escribe. */
const collapseSpaces = (value: string) => value.replace(/^\s+/, '').replace(/ {2,}/g, ' ');

export const sanitizeName = (value: string) =>
  collapseSpaces(value.replace(NAME_ALLOWED, '')).slice(0, LIMITS.nombre.max);

export const sanitizeText = (value: string, max: number) =>
  collapseSpaces(value.replace(TEXT_ALLOWED, '')).slice(0, max);

export const sanitizeLongText = (value: string, max: number) =>
  value.replace(LONG_TEXT_ALLOWED, '').replace(/^\s+/, '').replace(/ {2,}/g, ' ').slice(0, max);

export const sanitizeEmail = (value: string) =>
  value.replace(EMAIL_ALLOWED, '').toLowerCase().slice(0, LIMITS.email.max);

/** Solo dígitos, un "+" opcional al inicio y espacios. */
export const sanitizePhone = (value: string) => {
  const hasPlus = value.trimStart().startsWith('+');
  const digits = value.replace(/[^0-9 ]/g, '').replace(/ {2,}/g, ' ').trimStart();
  return ((hasPlus ? '+' : '') + digits).slice(0, LIMITS.telefono.max + 5);
};

/** Números con hasta 2 decimales; acepta coma o punto como separador. */
export const sanitizeAmount = (value: string) => {
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const [entero = '', ...resto] = normalized.split('.');
  const enteroLimpio = entero.replace(/^0+(?=\d)/, '').slice(0, 7);
  if (resto.length === 0) return enteroLimpio;
  return `${enteroLimpio}.${resto.join('').slice(0, 2)}`;
};

export const sanitizePassword = (value: string) =>
  value.replace(/\s/g, '').slice(0, LIMITS.password.max);

// ---------- Validadores ----------

export function validateName(value: string, campo = 'El nombre'): string | null {
  const v = value.trim();
  if (!v) return `${campo} es obligatorio.`;
  if (v.length < LIMITS.nombre.min) return `${campo} debe tener al menos ${LIMITS.nombre.min} letras.`;
  if (v.length > LIMITS.nombre.max) return `${campo} no puede superar ${LIMITS.nombre.max} caracteres.`;
  if (new RegExp(NAME_ALLOWED.source).test(v)) return `${campo} solo puede contener letras y espacios.`;
  return null;
}

export function validateEmail(value: string, required = true): string | null {
  const v = value.trim();
  if (!v) return required ? 'El correo electrónico es obligatorio.' : null;
  if (v.length > LIMITS.email.max) return `El correo no puede superar ${LIMITS.email.max} caracteres.`;
  if (!EMAIL_REGEX.test(v)) return 'Ingresa un correo válido, por ejemplo: nombre@correo.com';
  return null;
}

export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: `Entre ${LIMITS.password.min} y ${LIMITS.password.max} caracteres`, test: (v) => v.length >= LIMITS.password.min && v.length <= LIMITS.password.max },
  { label: 'Una letra mayúscula', test: (v) => /[A-ZÁÉÍÓÚÑ]/.test(v) },
  { label: 'Una letra minúscula', test: (v) => /[a-záéíóúñ]/.test(v) },
  { label: 'Un número', test: (v) => /\d/.test(v) },
  { label: 'Un carácter especial (!@#$%&*...)', test: (v) => /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/.test(v) },
];

export function validatePassword(value: string): string | null {
  if (!value) return 'La contraseña es obligatoria.';
  if (/\s/.test(value)) return 'La contraseña no puede contener espacios.';
  if (value.length < LIMITS.password.min || value.length > LIMITS.password.max) {
    return `La contraseña debe tener entre ${LIMITS.password.min} y ${LIMITS.password.max} caracteres.`;
  }
  const failed = PASSWORD_RULES.find((rule) => !rule.test(value));
  return failed ? `La contraseña debe incluir: ${failed.label.toLowerCase()}.` : null;
}

export function validatePasswordConfirmation(password: string, confirm: string): string | null {
  if (!confirm) return 'Confirma tu contraseña.';
  if (password !== confirm) return 'Las contraseñas no coinciden.';
  return null;
}

export function validateOptionalText(
  value: string,
  campo: string,
  limits: { min?: number; max: number },
  required = false
): string | null {
  const v = value.trim();
  if (!v) return required ? `${campo} es obligatorio.` : null;
  if (limits.min && v.length < limits.min) return `${campo} debe tener al menos ${limits.min} caracteres.`;
  if (v.length > limits.max) return `${campo} no puede superar ${limits.max} caracteres.`;
  return null;
}

export function validatePhone(value: string): string | null {
  const v = value.trim();
  if (!v) return null; // opcional
  const digits = v.replace(/\D/g, '');
  if (digits.length < LIMITS.telefono.min || digits.length > LIMITS.telefono.max) {
    return `El teléfono debe tener entre ${LIMITS.telefono.min} y ${LIMITS.telefono.max} dígitos.`;
  }
  return null;
}

export function validateAmount(value: string): string | null {
  if (!value) return 'El monto es obligatorio.';
  const n = Number(value);
  if (isNaN(n) || n <= 0) return 'Ingresa un monto mayor a 0.';
  if (n > LIMITS.monto.max) return `El monto no puede superar $${LIMITS.monto.max.toLocaleString('es-ES')}.`;
  return null;
}

// ---------- Traducción de errores de Supabase ----------

const AUTH_ERRORS: [RegExp, string][] = [
  [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/email not confirmed/i, 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'],
  [/user already registered|already been registered/i, 'Ya existe una cuenta registrada con este correo.'],
  [/password should be at least/i, 'La contraseña es demasiado corta.'],
  [/weak.?password|password is too weak/i, 'La contraseña es demasiado débil. Usa mayúsculas, minúsculas, números y símbolos.'],
  [/same.?password|different from the old password/i, 'La nueva contraseña debe ser diferente a la anterior.'],
  [/unable to validate email|invalid email|email address .* is invalid/i, 'El correo electrónico no es válido.'],
  [/rate limit|too many requests|security purposes/i, 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.'],
  [/network request failed|fetch failed|network/i, 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'],
  [/jwt expired|session.*(missing|expired)|auth session missing/i, 'Tu sesión expiró. Vuelve a iniciar sesión.'],
  [/signups not allowed|signup is disabled/i, 'El registro de nuevas cuentas está deshabilitado.'],
  [/user not found/i, 'No existe una cuenta con este correo.'],
];

/** Convierte un error (normalmente en inglés) a un mensaje en español para el usuario. */
export function translateError(error: unknown, fallback = 'Ocurrió un error inesperado. Inténtalo de nuevo.'): string {
  const message = typeof error === 'string' ? error : (error as { message?: string })?.message;
  if (!message) return fallback;
  const match = AUTH_ERRORS.find(([regex]) => regex.test(message));
  return match ? match[1] : fallback;
}

// ---------- Formularios de la app ----------

export interface ClientFormValues {
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  notas: string;
}

export type ClientFormErrors = Partial<Record<keyof ClientFormValues, string | null>>;

export function validateClientForm(values: ClientFormValues): ClientFormErrors {
  return {
    nombre: validateName(values.nombre, 'El nombre del cliente'),
    email: validateEmail(values.email, false),
    telefono: validatePhone(values.telefono),
    empresa: validateOptionalText(values.empresa, 'El nombre de la empresa', LIMITS.empresa),
    notas: validateOptionalText(values.notas, 'Las notas', LIMITS.notas),
  };
}

export const hasErrors = (errors: Record<string, string | null | undefined>) =>
  Object.values(errors).some(Boolean);
