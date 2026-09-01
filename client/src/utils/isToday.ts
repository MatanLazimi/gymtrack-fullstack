export function isToday(dateString: string): boolean {
  return new Date(dateString).toDateString() === new Date().toDateString();
}
