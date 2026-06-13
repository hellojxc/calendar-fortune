/**
 * AsyncStorage-backed schedule CRUD.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScheduleItem } from '../types';

const KEY = '@fortune/schedule';

let idCounter = Date.now();

function nextId(): string {
  return `sched_${++idCounter}`;
}

export async function loadSchedule(): Promise<ScheduleItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const items: ScheduleItem[] = JSON.parse(raw);
    // Restore idCounter from stored items
    for (const item of items) {
      const num = parseInt(item.id.replace('sched_', ''), 10);
      if (!isNaN(num) && num > idCounter) idCounter = num;
    }
    return items;
  } catch {
    return [];
  }
}

async function saveSchedule(items: ScheduleItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function addSchedule(item: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> {
  const items = await loadSchedule();
  const created: ScheduleItem = { ...item, id: nextId() };
  items.push(created);
  items.sort((a, b) => {
    const da = a.date || '9999';
    const db = b.date || '9999';
    if (da !== db) return da.localeCompare(db);
    return (a.time || '').localeCompare(b.time || '');
  });
  await saveSchedule(items);
  return created;
}

export async function loadScheduleForDate(dateStr: string): Promise<ScheduleItem[]> {
  const items = await loadSchedule();
  return items.filter((i) => i.date === dateStr);
}

export async function updateSchedule(id: string, updates: Partial<ScheduleItem>): Promise<void> {
  const items = await loadSchedule();
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...updates };
    items.sort((a, b) => {
      const da = a.date || '9999';
      const db = b.date || '9999';
      if (da !== db) return da.localeCompare(db);
      return (a.time || '').localeCompare(b.time || '');
    });
    await saveSchedule(items);
  }
}

export async function deleteSchedule(id: string): Promise<void> {
  const items = await loadSchedule();
  await saveSchedule(items.filter((i) => i.id !== id));
}
