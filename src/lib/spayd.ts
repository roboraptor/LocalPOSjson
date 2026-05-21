/**
 * Utility for Short Payment Descriptor (SPAYD) generation.
 * Spec: http://www.spayd.org/
 */

export interface SpaydOptions {
  iban: string;
  amount?: number | string;
  currency?: string;
  vs?: string;
  ks?: string;
  ss?: string;
  msg?: string;
}

export function generateSpaydString(options: SpaydOptions): string {
  const { iban, amount, currency, vs, ks, ss, msg } = options;

  if (!iban) return '';

  // Clean IBAN (remove spaces)
  const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
  
  let spayd = `SPD*1.0*ACC:${cleanIban}*PT:IP`;

  if (amount) {
    const formattedAmount = Number(amount).toFixed(2);
    spayd += `*AM:${formattedAmount}`;
  }

  if (currency) {
    spayd += `*CC:${currency.toUpperCase()}`;
  }

  if (vs) {
    spayd += `*X-VS:${String(vs).slice(0, 10)}`;
  }

  if (ks) {
    spayd += `*X-KS:${String(ks).slice(0, 4)}`;
  }

  if (ss) {
    spayd += `*X-SS:${String(ss).slice(0, 10)}`;
  }

  if (msg) {
    // Message should be URL encoded or at least limited in chars
    // SPAYD spec says restricted charset, but most readers handle basic accents
    const cleanMsg = msg.substring(0, 60).replace(/\*/g, ' '); 
    spayd += `*MSG:${cleanMsg}`;
  }

  return spayd;
}

/**
 * Získat SPAYD řetězec z externího API (api.paylibo.com)
 */
export async function fetchExternalSpaydString(options: SpaydOptions): Promise<string> {
  const { iban, amount, currency, vs, ks, msg } = options;
  if (!iban) return '';
  
  const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
  const params = new URLSearchParams();
  params.append('iban', cleanIban);
  
  if (amount) params.append('amount', Number(amount).toFixed(2));
  if (currency) params.append('currency', currency.toUpperCase());
  if (vs) params.append('vs', String(vs).slice(0, 10));
  if (ks) params.append('ks', String(ks).slice(0, 4));
  if (msg) params.append('message', msg.substring(0, 60));

  const url = `https://api.paylibo.com/paylibo/generator/string?${params.toString()}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not ok');
    const text = await res.text();
    return text;
  } catch (err) {
    console.error('Failed to fetch SPAYD from external API, falling back to local.', err);
    return generateSpaydString(options); // Fallback to local
  }
}

