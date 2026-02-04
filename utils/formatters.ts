import { RiskLevel, SustainabilityLevel, EffortLevel, ConfidenceBand } from '../types/analytics';
import { RouteProfile } from '../types/route';

export function formatHours(value: number): string {
  if (value < 1) {
    const minutes = Math.round(value * 60);
    return `${minutes} min`;
  }
  if (value < 10 && value % 1 !== 0) {
    return `${value.toFixed(1)} h`;
  }
  return `${Math.round(value)} h`;
}

export function formatWeeks(weeks: number): string {
  if (weeks === 1) return '1 week';
  return `${weeks} weeks`;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}

export function formatRiskLevel(risk: RiskLevel): string {
  switch (risk) {
    case 'very_low':
      return 'Very low';
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    case 'very_high':
      return 'Very high';
  }
}

export function formatSustainability(level: SustainabilityLevel): string {
  switch (level) {
    case 'fragile':
      return 'Fragile';
    case 'stable':
      return 'Stable';
    case 'stretch':
      return 'Stretch';
  }
}

export function formatEffortLevel(level: EffortLevel): string {
  switch (level) {
    case 'light':
      return 'Light';
    case 'moderate':
      return 'Moderate';
    case 'heavy':
      return 'Heavy';
  }
}

export function formatConfidenceBand(band: ConfidenceBand): string {
  switch (band) {
    case 'very_low':
      return 'Very low';
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    case 'very_high':
      return 'Very high';
  }
}

export function formatRouteProfile(profile: RouteProfile): string {
  switch (profile) {
    case 'fast':
      return 'Fast';
    case 'balanced':
      return 'Balanced';
    case 'safe':
      return 'Safe';
    case 'prestige':
      return 'Prestige';
  }
}
