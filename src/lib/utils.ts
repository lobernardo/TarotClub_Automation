import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza número de WhatsApp removendo tudo que não for dígito.
 * Aplicar antes de INSERT/UPDATE no campo whatsapp.
 */
export function normalizeWhatsapp(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/\D/g, "");
  return normalized.length > 0 ? normalized : null;
}
