// The party's date, time and place live in event.json; this writes them everywhere they appear (dev only). Run from the
// repo root:
//   node tools/event-sync.mjs           site/index.html (the card's When and Where, the Directions and Google Calendar
//                                       links, the countdown's day, the description lines WhatsApp shows, the preview's
//                                       address) and site/taneira-2nd-birthday.ics
//   node tools/event-sync.mjs --check   changes nothing; fails if either file isn't what event.json says
// Times are on Chennai's clock, whatever the computer's.
import { readFileSync, writeFileSync } from 'node:fs';

const e = JSON.parse(readFileSync('event.json', 'utf8'));
const start = new Date(e.start), end = new Date(e.end);
const ist = (d, o, locale = 'en-GB') => new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Kolkata', ...o }).format(d);
const weekday = ist(start, { weekday: 'long' }), date = ist(start, { day: 'numeric', month: 'long' }); // Saturday, 28 November
const [from, to] = [start, end].map(d => ist(d, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '').toUpperCase().split(/\s/));
const time = from[1] === to[1] ? `${from[0]} – ${to[0]} ${to[1]}` : `${from.join(' ')} – ${to.join(' ')}`; // 6 – 8 PM
const place = `${e.venue}, ${e.area}, ${e.city}`;
const utc = d => d.toISOString().replace(/[-:]|\.\d{3}/g, ''); // 20261128T123000Z
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const title = `${e.summary} 🦋`;
const google = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
  action: 'TEMPLATE', text: title, dates: `${utc(start)}/${utc(end)}`, location: place, details: e.note,
});

// each place in the page, found by what surrounds it; one that has gone missing fails the run
const PAGE = [
  [/(<meta name="description" content=")[^"]*/, `Come celebrate ${e.summary} · ${weekday} ${date}, ${time} · ${place}`],
  [/(<meta property="og:description" content=")[^"]*/, `${weekday} ${date}, ${time} · ${e.venue}, ${e.area}`],
  [/(<meta property="og:url" content=")[^"]*/, e.site],
  [/(<meta property="og:image" content=")[^"]*/, new URL('og.jpg', e.site).href],
  [/(<dd data-event="when">)[^]*?(?=<\/dd>)/, `${weekday}, ${date}<br>${time}`, false],
  [/(<dd data-event="where">)[^]*?(?=<\/dd>)/, `${e.venue}<br>${e.area}, ${e.city}`, false],
  [/(<a [^>]*data-event="maps" href=")[^"]*/, `https://www.google.com/maps/dir/?api=1&destination=${e.map.join(',')}`],
  [/(<a [^>]*data-event="calendar" [^>]*data-google=")[^"]*/, google],
  [/(<p class="countdown" data-day=")[^"]*/, ist(start, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA')],
];
let html = readFileSync('site/index.html', 'utf8');
for (const [re, value, attr = true] of PAGE) {
  if (!re.test(html)) throw new Error(`site/index.html has nowhere for ${re}`);
  html = html.replace(re, (_, before) => before + (attr ? esc(value) : value));
}

const text = s => s.replace(/[\\;,]/g, c => `\\${c}`);
const ics = [
  'BEGIN:VCALENDAR', 'VERSION:2.0', "PRODID:-//Taneira's family//Birthday invite//EN", 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  'BEGIN:VEVENT', `UID:taneira-2nd-birthday-${utc(start).slice(0, 8)}@invite`, 'DTSTAMP:20261021T000000Z',
  `DTSTART:${utc(start)}`, `DTEND:${utc(end)}`, `SUMMARY:${text(title)}`, `LOCATION:${text(place)}`, `GEO:${e.map.join(';')}`,
  `DESCRIPTION:${text(e.note)}`, 'END:VEVENT', 'END:VCALENDAR', '',
].join('\r\n');

const out = [['site/index.html', html], ['site/taneira-2nd-birthday.ics', ics]];
const stale = out.filter(([path, body]) => readFileSync(path, 'utf8') !== body).map(([path]) => path);
if (process.argv.includes('--check')) {
  console.log(stale.length ? `not what event.json says: ${stale.join(', ')} (run node tools/event-sync.mjs)` : 'in step with event.json');
  process.exit(stale.length ? 1 : 0);
}
for (const [path, body] of out) writeFileSync(path, body);
console.log(stale.length ? `updated ${stale.join(', ')}` : 'already in step with event.json');
