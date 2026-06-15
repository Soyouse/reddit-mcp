import { describe, it, expect } from 'vitest';
import { warmupGate, DEFAULT_THRESHOLDS } from '../lib/safety/warmup.js';

const DAY = 86_400_000;
const NOW = 100 * DAY; // ancrage temporel fixe

describe('warmupGate (anti compte jetable)', () => {
  it('un compte warm:true bypasse toutes les restrictions', () => {
    const account = { createdAt: NOW, karma: 0, warm: true };
    const r = warmupGate({ account, action: 'dm', now: NOW });
    expect(r.allowed).toBe(true);
  });

  it('la lecture est toujours autorisée même sur compte neuf', () => {
    const account = { createdAt: NOW, karma: 0 };
    const r = warmupGate({ account, action: 'read', now: NOW });
    expect(r.allowed).toBe(true);
  });

  it('bloque une écriture sur compte trop jeune', () => {
    const account = { createdAt: NOW - 1 * DAY, karma: 100 };
    const r = warmupGate({ account, action: 'submit', now: NOW }); // submit = 7j requis
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/jeune/);
  });

  it('bloque sur karma insuffisant même si l\'âge est ok', () => {
    const account = { createdAt: NOW - 30 * DAY, karma: 2 };
    const r = warmupGate({ account, action: 'comment', now: NOW }); // comment = 5 karma
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/karma/);
  });

  it('autorise quand âge ET karma satisfont le palier', () => {
    const account = { createdAt: NOW - 30 * DAY, karma: 100 };
    const r = warmupGate({ account, action: 'submit', now: NOW });
    expect(r.allowed).toBe(true);
    expect(r.reason).toBeNull();
  });

  it('seuils par défaut ordonnés en sévérité croissante', () => {
    const t = DEFAULT_THRESHOLDS;
    expect(t.read.minAgeDays).toBeLessThanOrEqual(t.vote.minAgeDays);
    expect(t.vote.minAgeDays).toBeLessThanOrEqual(t.comment.minAgeDays);
    expect(t.comment.minAgeDays).toBeLessThanOrEqual(t.submit.minAgeDays);
    expect(t.submit.minAgeDays).toBeLessThanOrEqual(t.dm.minAgeDays);
  });

  it('rejette une action inconnue', () => {
    const account = { createdAt: NOW, karma: 10 };
    expect(() => warmupGate({ account, action: 'nuke', now: NOW })).toThrow();
  });
});
