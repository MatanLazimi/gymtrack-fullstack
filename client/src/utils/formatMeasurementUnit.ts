import type { MeasurementUnit } from '../types/exercise';

const LABELS: Record<MeasurementUnit, string> = {
  kg: 'ק"ג',
  hole: 'חור',
};

export function formatMeasurementUnit(unit: MeasurementUnit): string {
  return LABELS[unit];
}
