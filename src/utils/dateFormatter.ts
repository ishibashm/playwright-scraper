import { format } from 'date-fns';

export function formatDate(date: Date, formatStr = 'yyyy-MM-dd_HH-mm-ss') {
  return format(date, formatStr);
}
