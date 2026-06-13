/**
 * Tests for Calendar week navigation logic and schedule date filtering.
 * Run: npx jest src/__tests__/calendar.test.ts
 */

// ── Week navigation: pure Date arithmetic (extracted from CalendarScreen) ──

function weekJump(currentYear: number, currentMonth: number, currentDay: number, delta: number): { y: number; m: number; d: number } {
  const d = new Date(currentYear, currentMonth - 1, currentDay);
  d.setDate(d.getDate() + delta);
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

describe('weekJump (Date-based cross-month/year)', () => {
  test('within same month', () => {
    const r = weekJump(2026, 6, 10, 7);
    expect(r).toEqual({ y: 2026, m: 6, d: 17 });
  });

  test('backward within same month', () => {
    const r = weekJump(2026, 6, 20, -7);
    expect(r).toEqual({ y: 2026, m: 6, d: 13 });
  });

  test('cross month forward (Jan 28 +7 → Feb 4)', () => {
    const r = weekJump(2026, 1, 28, 7);
    expect(r).toEqual({ y: 2026, m: 2, d: 4 });
  });

  test('cross month backward (Mar 3 -7 → Feb 24)', () => {
    const r = weekJump(2026, 3, 3, -7);
    expect(r).toEqual({ y: 2026, m: 2, d: 24 });
  });

  test('cross year forward (Dec 30 +7 → Jan 6)', () => {
    const r = weekJump(2026, 12, 30, 7);
    expect(r).toEqual({ y: 2027, m: 1, d: 6 });
  });

  test('cross year backward (Jan 3 -7 → Dec 27)', () => {
    const r = weekJump(2027, 1, 3, -7);
    expect(r).toEqual({ y: 2026, m: 12, d: 27 });
  });

  test('leap year Feb 22 +7 → Feb 29 (2024 is leap)', () => {
    const r = weekJump(2024, 2, 22, 7);
    expect(r).toEqual({ y: 2024, m: 2, d: 29 });
  });

  test('leap year Feb 25 +7 → Mar 3', () => {
    const r = weekJump(2024, 2, 25, 7);
    expect(r).toEqual({ y: 2024, m: 3, d: 3 });
  });

  test('non-leap year Feb 22 +7 → Mar 1', () => {
    const r = weekJump(2025, 2, 22, 7);
    expect(r).toEqual({ y: 2025, m: 3, d: 1 });
  });
});

// ── Schedule date filtering ──

function filterByDate(items: Array<{ date: string }>, dateStr: string): Array<{ date: string }> {
  return items.filter((s) => s.date === dateStr);
}

describe('schedule date filter', () => {
  const items = [
    { id: '1', date: '2026-06-13', time: '09:30', title: 'A', hint: '', type: 'meeting' },
    { id: '2', date: '2026-06-13', time: '14:00', title: 'B', hint: '', type: 'health' },
    { id: '3', date: '2026-06-14', time: '10:00', title: 'C', hint: '', type: 'personal' },
  ];

  test('filters today schedules', () => {
    const today = filterByDate(items, '2026-06-13');
    expect(today).toHaveLength(2);
  });

  test('no schedules for empty day', () => {
    expect(filterByDate(items, '2026-06-15')).toHaveLength(0);
  });
});
