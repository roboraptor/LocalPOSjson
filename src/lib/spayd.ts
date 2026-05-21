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
