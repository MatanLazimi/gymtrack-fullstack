const formatter = new Intl.DateTimeFormat('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatWorkoutDate(dateString: string): string {
  return formatter.format(new Date(dateString));
}
