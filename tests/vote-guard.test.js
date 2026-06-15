import { describe, it, expect } from 'vitest';
import { voteGuardDecision } from '../lib/safety/vote-guard.js';

describe('voteGuardDecision (anti-manipulation de vote)', () => {
  it('autorise un vote sur une cible jamais votée', () => {
    const r = voteGuardDecision({ target: 't3_a', account: 'pro', history: [] });
    expect(r.allowed).toBe(true);
    expect(r.reason).toBeNull();
  });

  it('autorise le MÊME compte à re-voter sa propre cible (changer son vote)', () => {
    const history = [{ account: 'pro', target: 't3_a' }];
    const r = voteGuardDecision({ target: 't3_a', account: 'pro', history });
    expect(r.allowed).toBe(true);
  });

  it('BLOQUE un AUTRE compte sur une cible déjà votée (manip cross-comptes)', () => {
    const history = [{ account: 'pro', target: 't3_a' }];
    const r = voteGuardDecision({ target: 't3_a', account: 'perso', history });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/manipulation/);
  });

  it('autorise un autre compte sur une cible DIFFÉRENTE', () => {
    const history = [{ account: 'pro', target: 't3_a' }];
    const r = voteGuardDecision({ target: 't3_b', account: 'perso', history });
    expect(r.allowed).toBe(true);
  });

  it('history absent (undefined) = autorisé', () => {
    const r = voteGuardDecision({ target: 't3_a', account: 'pro', history: undefined });
    expect(r.allowed).toBe(true);
  });

  it('rejette des paramètres manquants', () => {
    expect(() => voteGuardDecision({ target: '', account: 'pro', history: [] })).toThrow();
    expect(() => voteGuardDecision({ target: 't3_a', account: '', history: [] })).toThrow();
  });
});
