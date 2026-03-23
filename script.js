let currentLang = 'en';
let searchMap = null;
let userLat = null;
let userLng = null;
const tailors = [];
 
const t = {
  en: {
    noTailors: 'No tailors registered yet.',
    allShown: '📍 All tailors shown',
    tailorsFound: ' verified tailors found',
    locDetecting: '📍 Detecting your location...',
    locSet: '✅ Location: ',
    locAllow: '❌ Please allow location access!',
    youAreHere: 'You are here',
    bookNow: 'Book Now',
    noResult: 'No tailor found. Try a different search.',
  },
  hi: {
    noTailors: 'अभी कोई दर्जी रजिस्टर नहीं।',
    allShown: '📍 सभी दर्जी दिख रहे हैं',
    tailorsFound: ' verified दर्जी मिले',
    locDetecting: '📍 लोकेशन पता की जा रही है...',
    locSet: '✅ लोकेशन: ',
    locAllow: '❌ कृपया लोकेशन की अनुमति दें!',
    youAreHere: 'आप यहाँ हैं',
    bookNow: 'अभी बुक करें',
    noResult: 'कोई दर्जी नहीं मिला। कुछ और खोजें।',
  }
};
 
window.onload = function () {
  setLang('en');
  renderTailors(tailors);
  initSearchMap(27.1767, 78.0081);
};
 
function setLang(lang) {
  currentLang = lang;
 
  document.getElementById('btn-en').style.background = lang === 'en' ? 'white' : 'rgba(255,255,255,0.2)';
  document.getElementById('btn-en').style.color = lang === 'en' ? '#0F6E56' : 'white';
  document.getElementById('btn-en').style.border = lang === 'en' ? 'none' : '1px solid rgba(255,255,255,0.5)';
 
  document.getElementById('btn-hi').style.background = lang === 'hi' ? 'white' : 'rgba(255,255,255,0.2)';
  document.getElementById('btn-hi').style.color = lang === 'hi' ? '#0F6E56' : 'white';
  document.getElementById('btn-hi').style.border = lang === 'hi' ? 'none' : '1px solid rgba(255,255,255,0.5)';
 
  // Update all data-en / data-hi elements
  document.querySelectorAll('[data-en]').forEach(el => {
    const val = el.getAttribute('data-' + lang);
    if (val) {
      if (el.tagName === 'INPUT') {
        el.placeholder = val;
      } else if (el.tagName === 'BUTTON' || el.tagName === 'OPTION') {
        el.textContent = val;
      } else {
        el.innerHTML = val;
      }
    }
  });
 
  // Update placeholders
  document.querySelectorAll('[data-en-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute('data-' + lang + '-placeholder') || el.getAttribute('data-en-placeholder');
  });
 
  renderTailors(tailors);
}
 
function show(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + screenName).classList.add('active');
  window.scrollTo(0, 0);
  if (screenName === 'search') {
    renderTailors(tailors);
    setTimeout(() => { if (searchMap) searchMap.invalidateSize(); }, 200);
  }
}
 
function initSearchMap(lat, lng) {
  const mapDiv = document.getElementById('real-search-map');
  if (!mapDiv) return;
  if (searchMap) { searchMap.remove(); searchMap = null; }
  searchMap = L.map('real-search-map').setView([lat, lng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(searchMap);
}
 
function useLocation() {
  const status = document.getElementById('loc-status');
  status.textContent = t[currentLang].locDetecting;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        userLat = pos.coords.latitude.toFixed(4);
        userLng = pos.coords.longitude.toFixed(4);
        if (searchMap) {
          searchMap.setView([parseFloat(userLat), parseFloat(userLng)], 14);
          const youIcon = L.divIcon({
            html: '<div style="background:#D85A30;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
            className: '', iconAnchor: [8, 8]
          });
          L.marker([parseFloat(userLat), parseFloat(userLng)], { icon: youIcon })
            .addTo(searchMap)
            .bindPopup('<b>' + t[currentLang].youAreHere + '</b>').openPopup();
        }
        fetch('https://nominatim.openstreetmap.org/reverse?lat=' + userLat + '&lon=' + userLng + '&format=json')
          .then(r => r.json())
          .then(data => {
            const a = data.address;
            const city = a.city || a.town || a.village || '';
            status.textContent = t[currentLang].locSet + city + ', ' + (a.state || '');
          })
          .catch(() => { status.textContent = t[currentLang].locSet + userLat + ', ' + userLng; });
        renderTailors(tailors);
      },
      function () { status.textContent = t[currentLang].locAllow; }
    );
  }
}
 
function doSearch() {
  const query = document.getElementById('search-q').value.toLowerCase().trim();
  const filtered = query.length === 0 ? tailors : tailors.filter(t =>
    t.name.toLowerCase().includes(query) ||
    t.area.toLowerCase().includes(query) ||
    t.tags.some(tag => tag.toLowerCase().includes(query))
  );
  renderTailors(filtered);
}
 
function renderTailors(list) {
  const grid = document.getElementById('tailor-results');
  const homeGrid = document.getElementById('home-tailors');
  const count = document.getElementById('result-count');
 
  const emptyHTML = `<div style="text-align:center;padding:3rem;grid-column:1/-1;color:#888780">
    <div style="font-size:48px;margin-bottom:1rem">🧵</div>
    <p>${t[currentLang].noTailors}</p>
  </div>`;
 
  const cardHTML = (item) => `
    <div class="tailor-card">
      <div class="tailor-img">${item.emoji}</div>
      <div class="tailor-body">
        <div class="tailor-top">
          <div>
            <div class="tailor-name">${item.name}</div>
            <div class="tailor-loc">📍 ${item.area}, ${item.city}</div>
          </div>
          <span class="rating">⭐ ${item.rating}</span>
        </div>
        <div class="tags">${item.tags.map(tag => `<span class="tag tag-teal">${tag}</span>`).join('')}</div>
        <button class="btn-view" onclick="openProfile('${item.name}','${item.area + ', ' + item.city}','${item.rating}')">${t[currentLang].bookNow}</button>
      </div>
    </div>`;
 
  if (grid) {
    if (count) count.textContent = list.length > 0 ? list.length + t[currentLang].tailorsFound : t[currentLang].allShown;
    grid.innerHTML = list.length === 0
      ? `<div style="text-align:center;padding:3rem;grid-column:1/-1;color:#888780"><p>${t[currentLang].noResult}</p></div>`
      : list.map(cardHTML).join('');
  }
 
  if (homeGrid) {
    homeGrid.innerHTML = tailors.length === 0 ? emptyHTML : tailors.slice(0, 3).map(cardHTML).join('');
  }
}
 
function openProfile(name, addr, rating) {
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-addr').textContent = addr;
  document.getElementById('profile-rating').textContent = rating;
  document.getElementById('order-num').textContent = Math.floor(1000 + Math.random() * 9000);
  show('profile');
}
 
// Called from register.html after successful registration
function addTailor(tailor) {
  tailors.push(tailor);
  if (searchMap) {
    const icon = L.divIcon({
      html: `<div style="background:#0F6E56;color:white;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${tailor.emoji} ${tailor.name}</div>`,
      className: '', iconAnchor: [40, 20]
    });
    L.marker([tailor.lat, tailor.lng], { icon })
      .addTo(searchMap)
      .bindPopup(`<b>${tailor.name}</b><br>📍 ${tailor.area}`);
  }
  renderTailors(tailors);
}
 
function logout() {
  document.getElementById('user-bar').style.display = 'none';
  document.querySelector('.btn-nav').textContent = currentLang === 'en' ? 'Login / Register' : 'लॉगिन / रजिस्टर';
  show('home');
}
 
function showTrack() {
  document.getElementById('track-result').style.display = 'block';
}
 