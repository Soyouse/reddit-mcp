// vote-guard.js — REFUSE la manipulation de vote cross-comptes.
// ⚠️ PUR : décision sur historique fourni, aucun état interne, aucune I/O.
// ⚠️ Le guard BLOQUE, il n'avertit pas. Reddit bannit en RÉSEAU (tous les comptes liés) la manip de vote.
// Règle : 2 comptes DIFFÉRENTS du même opérateur ne votent JAMAIS la même cible. Re-vote du MÊME compte = OK (changer/retirer son vote).

/**
 * @param {object} p
 * @param {string} p.target - fullname Reddit de la cible (ex: "t3_abc", "t1_xyz").
 * @param {string} p.account - compte qui veut voter.
 * @param {Array<{account:string, target:string}>} p.history - votes déjà émis par les comptes de l'opérateur.
 * @returns {{allowed: boolean, reason: string|null}}
 */
export function voteGuardDecision({ target, account, history }) {
  if (!target || !account) {
    throw new Error('vote-guard: target et account requis');
  }
  // Un AUTRE compte a-t-il déjà voté cette même cible ? → manipulation → REFUS.
  const conflict = (history ?? []).some(
    (v) => v.target === target && v.account !== account,
  );
  if (conflict) {
    return {
      allowed: false,
      reason: `vote-manipulation: un autre compte a déjà voté ${target}`,
    };
  }
  return { allowed: true, reason: null };
}
