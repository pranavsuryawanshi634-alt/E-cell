/**
 * E-Cell SITRC Authorized Administrator Configuration
 * Explicitly approved institutional administrator accounts
 */

export interface AuthorizedAdminConfig {
  email: string;
  name: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export const AUTHORIZED_ADMIN_LIST: readonly AuthorizedAdminConfig[] = [
  {
    email: 'katkarayush21@gmail.com',
    name: 'Ayush Katkar',
    role: 'ADMIN',
  },
  {
    email: 'arcayush29@gmail.com',
    name: 'Ayush ARC',
    role: 'ADMIN',
  },
  {
    email: 'r480004@gmail.com',
    name: 'R. Administrator',
    role: 'ADMIN',
  },
  {
    email: 's8dharthrathod9822@gmail.com',
    name: 'Siddharth Rathod',
    role: 'ADMIN',
  },
  {
    email: 'maniyarrehan2006@gmail.com',
    name: 'Rehan Maniyar',
    role: 'ADMIN',
  },
  {
    email: 'najminshaikh075@gmail.com',
    name: 'Najmin Shaikh',
    role: 'ADMIN',
  },
  {
    email: 'nishikabajaj02@gmail.com',
    name: 'Nishika Bajaj',
    role: 'ADMIN',
  },
  {
    email: 'pranavsuryawanshi634@gmail.com',
    name: 'Pranav Suryawanshi',
    role: 'ADMIN',
  },
  {
    email: 'promayuresh20@gmail.com',
    name: 'Mayuresh Pro',
    role: 'ADMIN',
  },
] as const;

export const AUTHORIZED_ADMIN_EMAILS = new Set<string>(
  AUTHORIZED_ADMIN_LIST.map((admin) => admin.email.toLowerCase().trim())
);

/**
 * Validates if an email is in the authorized administrators list
 */
export function isAuthorizedAdminEmail(email: string): boolean {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.has(email.toLowerCase().trim());
}
