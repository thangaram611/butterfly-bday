export function invite(name) {
  const who = name ? `${name} will` : 'We’ll';
  const coming = document.querySelector('.coming');
  coming.href = 'https://wa.me/?text=' + encodeURIComponent(`Hi! ${who} be there for Taneira’s 2nd birthday 🦋`);

  // Once they've tapped it, the button thanks them: waiting when they come back from WhatsApp, and on every later visit
  // from this phone. It still opens WhatsApp, in case the message didn't go.
  const thank = () => {
    coming.textContent = 'Thank you! See you there';
    document.querySelector('.close .note').textContent = 'Didn’t send? Tap it again.';
  };
  try {
    if (localStorage.getItem('coming')) thank();
  } catch {}
  coming.addEventListener('click', () => {
    thank();
    try {
      localStorage.setItem('coming', '1');
    } catch {}
  });

  // Apple's Calendar takes the .ics file; anywhere else (Android), Google Calendar's link (event-sync.mjs writes both)
  const calendar = document.querySelector('[data-event="calendar"]');
  if (!/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) {
    calendar.href = calendar.dataset.google;
    calendar.removeAttribute('download');
  }

  // Whole days left, counted on the Chennai calendar whatever the guest's time zone
  const countdown = document.querySelector('.countdown');
  const [Y, M, D] = countdown.dataset.day.split('-').map(Number);
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).split('-').map(Number);
  const days = Math.round((Date.UTC(Y, M - 1, D) - Date.UTC(y, m - 1, d)) / 864e5);
  countdown.textContent =
    days > 1 ? `${days} days to go` : days === 1 ? 'Tomorrow!' : days === 0 ? 'Today’s the day! 🎉' : 'Thank you for celebrating with us 💜';
  countdown.hidden = false;
}
