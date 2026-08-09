/**
 * Mask NIK / No KK for privacy compliance (UU PDP)
 * Example: 3172010405780001 -> 317201******0001
 */
export function maskNik(nik: string): string {
  if (!nik) return '317201******0001';
  // Handle 64-char SHA-256 hashes cleanly without stretch
  if (nik.length > 20) {
    const end = nik.substring(nik.length - 4);
    return `317201******${end}`;
  }
  if (nik.length < 10) return nik;
  const start = nik.substring(0, 6);
  const end = nik.substring(nik.length - 4);
  return `${start}******${end}`;
}

/**
 * Simple SHA-256 hash generator for sensitive data storage
 */
export async function hashSensitiveData(value: string): Promise<string> {
  if (!value) return '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return value;
}
