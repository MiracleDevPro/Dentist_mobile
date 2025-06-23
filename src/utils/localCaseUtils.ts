// Utility functions for saving and loading cases locally
export interface ToothCase {
  id: string;
  caseName: string;
  imageUrl: string;
  toothLab: { L: number; a: number; b: number };
  matchedShade: { name: string; lab: { L: number; a: number; b: number } };
  referenceShade: string;
  deltaE: number;
  createdAt: string;
}

const CASES_KEY = 'tooth_shade_cases';

export function saveCaseLocally(toothCase: ToothCase) {
  const existing = loadCasesLocally();
  existing.push(toothCase);
  localStorage.setItem(CASES_KEY, JSON.stringify(existing));
}

export function loadCasesLocally(): ToothCase[] {
  const raw = localStorage.getItem(CASES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function deleteCaseLocally(id: string) {
  const existing = loadCasesLocally().filter(c => c.id !== id);
  localStorage.setItem(CASES_KEY, JSON.stringify(existing));
}
