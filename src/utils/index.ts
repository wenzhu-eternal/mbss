import type { Dayjs } from 'dayjs';
import * as dayjs from 'dayjs';

/**
 * @Description: 将日期范围按天分割
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 日期数组
 */
export function splitDate(startTime: Dayjs | Date, endTime: Dayjs | Date): Dayjs[] {
  const dateList: Dayjs[] = [];
  let current = dayjs(startTime);
  const end = dayjs(endTime);

  while (current.unix() <= end.unix()) {
    dateList.push(current);
    current = current.add(1, 'days');
  }

  return dateList;
}
