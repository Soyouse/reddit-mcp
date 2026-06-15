// warmup.js — gating des actions selon la MATURITÉ du compte (âge + karma).
// ⚠️ PUR : `now` injecté, aucun état, aucune I/O.
// But : un compte neuf qui poste/vote tout de suite = signature bot → shadowban. On ouvre les actions par paliers.
// Lecture = toujours libre. Écriture/vote/dm = gatées tant que le compte n'est pas "warm".

// Paliers par défaut (réglables via `thresholds`). Un compte `warm:true` (déclaré chauffé) bypasse tout.
// ⚠️ Ordre de sévérité croissant : read < vote < comment < submit < dm. NE PAS réordonner sans revoir les seuils.
export const DEFAULT_THRESHOLDS = {
  read: { minAgeDays: 0, minKarma: 0 },
  vote: { minAgeDays: 2, minKarma: 1 },
  comment: { minAgeDays: 3, minKarma: 5 },
  submit: { minAgeDays: 7, minKarma: 20 },
  dm: { minAgeDays: 14, minKarma: 50 },
};

const DAY_MS = 86_400_000;

/**
 * @param {object} p
 * @param {{createdAt:number, karma:number, warm?:boolean}} p.account
 * @param {string} p.action - une clé de thresholds (read|vote|comment|submit|dm).
 * @param {number} p.now - timestamp ms courant (INJECTÉ).
 * @param {object} [p.thresholds=DEFAULT_THRESHOLDS]
 * @returns {{allowed: boolean, reason: string|null}}
 */
export function warmupGate({ account, action, now, thresholds = DEFAULT_THRESHOLDS }) {
  const rule = thresholds[action];
  if (!rule) {
    throw new Error(`warmup: action inconnue "${action}"`);
  }
  // Compte explicitement chauffé (présence réelle établie hors-outil) → aucune restriction.
  if (account?.warm === true) {
    return { allowed: true, reason: null };
  }
  const ageDays = (now - account.createdAt) / DAY_MS;
  if (ageDays < rule.minAgeDays) {
    return {
      allowed: false,
      reason: `compte trop jeune pour "${action}" : ${ageDays.toFixed(1)}j < ${rule.minAgeDays}j`,
    };
  }
  if (account.karma < rule.minKarma) {
    return {
      allowed: false,
      reason: `karma insuffisant pour "${action}" : ${account.karma} < ${rule.minKarma}`,
    };
  }
  return { allowed: true, reason: null };
}
