import { describe, expect, it } from 'vitest';
import { readingTimeMinutes } from './readingTime.js';

describe('readingTimeMinutes', () => {
  it('returns 1 minute for empty content', () => {
    expect(readingTimeMinutes('')).toBe(1);
  });

  it('returns 1 for a single short paragraph', () => {
    expect(readingTimeMinutes('Hello world.')).toBe(1);
  });

  it('returns ~5 for ~1000 words at 200 wpm', () => {
    const text = 'word '.repeat(1000);
    expect(readingTimeMinutes(text)).toBe(5);
  });

  it('rounds up partial minutes', () => {
    const text = 'word '.repeat(250); // 1.25 min
    expect(readingTimeMinutes(text)).toBe(2);
  });
});
