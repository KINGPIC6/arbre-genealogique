// Toute erreur affichée à l'utilisateur doit rester générique.
// Le détail technique (SQL, JWT, stack trace, etc.) n'est jamais montré,
// il est seulement loggé en console pour le débogage développeur.
export const GENERIC_ERROR_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.';

export function toSafeMessage(error) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  return GENERIC_ERROR_MESSAGE;
}
