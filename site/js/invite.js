const PARTY = Date.UTC(2026, 10, 28); // Saturday 28 November 2026, in IST

export function invite(name) {
  const who = name ? `${name} will` : 'We’ll';
  document.querySelector('.coming').href =
    'https://wa.me/?text=' + encodeURIComponent(`Hi! ${who} be there for Taneira’s 2nd birthday 🦋`);

  // Whole days left, counted on the Chennai calendar whatever the guest's time zone
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).split('-').map(Number);
  const days = Math.round((PARTY - Date.UTC(y, m - 1, d)) / 864e5);
  const countdown = document.querySelector('.countdown');
  countdown.textContent =
    days > 1 ? `${days} days to go` : days === 1 ? 'Tomorrow!' : days === 0 ? 'Today’s the day! 🎉' : 'Thank you for celebrating with us 💜';
  countdown.hidden = false;
}
