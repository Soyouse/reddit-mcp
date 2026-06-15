// throttle.js — frein ANTI-FLOOD par compte.
// ⚠️ On est un bot ASSUMÉ (l'API Reddit nous déclare via client_id). But = NE PAS SPAMMER, PAS imiter un humain.
//    → aucun jitter/aléa, aucune "cadence humaine". Juste un débit plafonné pour ne pas inonder.
// ⚠️ PUR : `now` INJECTÉ, aucune horloge interne (déterminisme tests + reprise). NE JAMAIS lire Date.now() ici.
// Le rate-limit RÉSEAU de Reddit (100 req/min) est géré ailleurs via les headers X-Ratelimit ; ici = hygiène applicative anti-spam.

/**
 * Décide si une action d'écriture peut partir, ou doit attendre pour ne pas flooder.
 * @param {object} p
 * @param {number|null} p.lastActionAt - timestamp ms de la dernière action du compte (null = jamais agi).
 * @param {number} p.now - timestamp ms courant (INJECTÉ).
 * @param {number} p.minGapMs - écart minimal imposé entre 2 actions (anti-flood).
 * @returns {{allowed: boolean, waitMs: number, nextAllowedAt: number}}
 */
export function throttleDecision({ lastActionAt, now, minGapMs }) {
  if (!Number.isFinite(minGapMs) || minGapMs < 0) {
    throw new Error('throttle: minGapMs doit être un nombre >= 0');
  }
  // 1re action d'un compte : rien à espacer.
  if (lastActionAt == null) {
    return { allowed: true, waitMs: 0, nextAllowedAt: now };
  }
  const nextAllowedAt = lastActionAt + minGapMs;
  const waitMs = Math.max(0, nextAllowedAt - now);
  return { allowed: waitMs === 0, waitMs, nextAllowedAt };
}
