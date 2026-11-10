// Confirmed annual holiday data, not projected dates.
// Japan: https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html
// China: https://www.beijing.gov.cn/cs/gncs/zcwj/202603/t20260327_4568275.html
// Chinese entries denote the announced holiday periods; makeup workdays
// are deliberately left for a later iteration.
const japaneseHolidays = {
  2026: [
    ['01-01', '元日'], ['01-12', '成人の日'], ['02-11', '建国記念の日'],
    ['02-23', '天皇誕生日'], ['03-20', '春分の日'], ['04-29', '昭和の日'],
    ['05-03', '憲法記念日'], ['05-04', 'みどりの日'], ['05-05', 'こどもの日'],
    ['05-06', '振替休日'], ['07-20', '海の日'], ['08-11', '山の日'],
    ['09-21', '敬老の日'], ['09-22', '国民の休日'], ['09-23', '秋分の日'],
    ['10-12', 'スポーツの日'], ['11-03', '文化の日'], ['11-23', '勤労感謝の日'],
  ],
  2027: [
    ['01-01', '元日'], ['01-11', '成人の日'], ['02-11', '建国記念の日'],
    ['02-23', '天皇誕生日'], ['03-21', '春分の日'], ['03-22', '振替休日'],
    ['04-29', '昭和の日'], ['05-03', '憲法記念日'], ['05-04', 'みどりの日'],
    ['05-05', 'こどもの日'], ['07-19', '海の日'], ['08-11', '山の日'],
    ['09-20', '敬老の日'], ['09-23', '秋分の日'], ['10-11', 'スポーツの日'],
    ['11-03', '文化の日'], ['11-23', '勤労感謝の日'],
  ],
};

const chineseHolidays = {
  2026: [
    ['01-01', '01-03', '元旦'], ['02-15', '02-23', '春节'],
    ['04-04', '04-06', '清明节'], ['05-01', '05-05', '劳动节'],
    ['06-19', '06-21', '端午节'], ['09-25', '09-27', '中秋节'],
    ['10-01', '10-07', '国庆节'],
  ],
};

export function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function tokyoToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function monthDays(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(year, month, 1 - offset + index));
    return { key: dateKey(date), day: date.getUTCDate(), outside: date.getUTCMonth() !== month };
  });
}

export function holidaysOn(key) {
  const year = Number(key.slice(0, 4));
  const day = key.slice(5);
  const result = [];
  for (const [date, name] of japaneseHolidays[year] || []) {
    if (date === day) result.push({ name, start: key, end: key });
  }
  for (const [start, end, name] of chineseHolidays[year] || []) {
    if (day >= start && day <= end) result.push({ name, start: `${year}-${start}`, end: `${year}-${end}` });
  }
  return result;
}

export function missingHolidayRegions(year) {
  return [!japaneseHolidays[year] && '日本', !chineseHolidays[year] && '中国'].filter(Boolean);
}

export function tasksOn(key) {
  if (key < '2026-10-01' || key > '2026-11-30') return [];
  const date = new Date(`${key}T00:00:00Z`);
  if (date.getUTCDay() !== 2) return [];
  const daysSinceStart = (date.getTime() - Date.UTC(2026, 9, 6)) / 86400000;
  const presentation = daysSinceStart >= 0 && daysSinceStart % 14 === 0;
  return [{ name: presentation ? 'Zemi（发表）' : 'Zemi', kind: presentation ? 'presentation' : 'zemi' }];
}
