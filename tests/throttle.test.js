import { describe, it, expect } from 'vitest';
import { throttleDecision } from '../lib/safety/throttle.js';

describe('throttleDecision (frein anti-flood)', () => {
  it('autorise la 1re action (rien à espacer)', () => {
    const r = throttleDecision({ lastActionAt: null, now: 1000, minGapMs: 5000 });
    expect(r).toEqual({ allowed: true, waitMs: 0, nextAllowedAt: 1000 });
  });

  it('bloque et calcule le wait si le gap n\'est pas écoulé', () => {
    const r = throttleDecision({ lastActionAt: 1000, now: 3000, minGapMs: 5000 });
    expect(r.allowed).toBe(false);
    expect(r.waitMs).toBe(3000); // (1000+5000) - 3000
    expect(r.nextAllowedAt).toBe(6000);
  });

  it('autorise pile au moment où le gap est écoulé', () => {
    const r = throttleDecision({ lastActionAt: 1000, now: 6000, minGapMs: 5000 });
    expect(r.allowed).toBe(true);
    expect(r.waitMs).toBe(0);
  });

  it('autorise après dépassement du gap', () => {
    const r = throttleDecision({ lastActionAt: 1000, now: 9999, minGapMs: 5000 });
    expect(r.allowed).toBe(true);
    expect(r.waitMs).toBe(0);
  });

  it('gap=0 autorise toujours', () => {
    const r = throttleDecision({ lastActionAt: 1000, now: 1000, minGapMs: 0 });
    expect(r.allowed).toBe(true);
  });

  it('rejette un minGapMs invalide', () => {
    expect(() => throttleDecision({ lastActionAt: 1, now: 2, minGapMs: -1 })).toThrow();
    expect(() => throttleDecision({ lastActionAt: 1, now: 2, minGapMs: NaN })).toThrow();
  });
});
