// =============================================
// neonCinema - Premium Frontend Logic
// =============================================

const API_URL = 'http://localhost:3000';
const PLACEHOLDER_POSTER = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22500%22 height=%22750%22%3E%3Crect width=%22500%22 height=%22750%22 fill=%22%23111111%22 /%3E%3Ctext x=%22250%22 y=%22375%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23ffffff%22 font-family=%22Arial%2C%20sans-serif%22 font-size=%2230%22%3ENo%20Poster%3C/text%3E%3C/svg%3E';
let allMovies = [];
let allShows = [];
let currentMovie = null;
let currentShow = null;
let selectedSeats = [];
let heroIndex = 0;
let heroTimer = null;
const movieStats = {};
const TICKET_PRICE = 250;

const reviewTemplates = [
    'A thrilling ride with beautiful visuals and punchy performances.',
    'The story kept me hooked from start to finish — one of the best this year.',
    'Great action, strong cast, and a memorable soundtrack.',
    'This movie delivered more than expected. Perfect weekend watch.',
    'Strong writing with an emotional core and stunning cinematography.'
];

function randomRating() {
    return (7 + Math.random() * 2).toFixed(1);
}

function randomLikes() {
    return 1200 + Math.floor(Math.random() * 5400);
}

function getMovieStats(movie) {
    if (!movieStats[movie.id]) {
        const names = ['Aanya', 'Shine', 'Priya', 'Karan', 'Aditi', 'Charan', 'Sneha', 'Vikram'];
        const numReviews = Math.floor(Math.random() * 4) + 2; // 2 to 5 reviews
        const generatedReviews = Array.from({ length: numReviews }, () => ({
            name: names[Math.floor(Math.random() * names.length)],
            text: reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)],
            stars: 4 + Math.floor(Math.random() * 2)
        }));

        movieStats[movie.id] = {
            rating: randomRating(),
            likes: randomLikes(),
            reviews: generatedReviews
        };
    }
    return movieStats[movie.id];
}

function encodeSvgText(text) {
    return encodeURIComponent(text).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function createPosterPlaceholder(title) {
    const label = title ? title.toUpperCase().slice(0, 24) : 'NO POSTER';
    const encoded = encodeSvgText(label);
    return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22500%22 height=%22750%22%3E%3Crect width=%22500%22 height=%22750%22 fill=%22%23111111%22 /%3E%3Ctext x=%22250%22 y=%22375%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23ffffff%22 font-family=%22Arial%2C%20sans-serif%22 font-size=%2230%22%3E${encoded}%3C/text%3E%3C/svg%3E`;
}

function handlePosterError(event) {
    event.target.onerror = null;
    event.target.src = event.target.dataset.fallback || PLACEHOLDER_POSTER;
}

function createPosterImage(src, alt, className) {
    const img = document.createElement('img');
    img.alt = alt || 'Movie Poster';
    img.className = className;
    img.loading = 'lazy';
    img.dataset.fallback = createPosterPlaceholder(alt || 'No Poster');
    img.onerror = handlePosterError;
    img.src = src || img.dataset.fallback;
    return img;
}

// =============================================
// ON PAGE LOAD
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('logged_in') === 'true') {
        enterApp();
    } else {
        checkHostStatus();
    }
});

// =============================================
// AUTH & APP ENTRY
// =============================================
async function checkHostStatus() {
    try {
        const response = await fetch(`${API_URL}/check-host`);
        const data = await response.json();
        document.getElementById('auth-loading').style.display = 'none';
        document.getElementById('auth-form').style.display = 'block';

        if (data.hasHost === false) {
            setAuthMode('signup');
        } else {
            setAuthMode('login');
        }
    } catch (err) {
        document.getElementById('auth-loading').innerHTML =
            `<p style="color:#ff5252;">❌ Server Offline<br><small>Run: node server.js</small></p>`;
    }
}

function setAuthMode(mode) {
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-btn');
    const toggle = document.getElementById('auth-toggle');
    const signupFields = document.getElementById('signup-fields');
    document.getElementById('auth-mode').value = mode;

    if (mode === 'signup') {
        title.innerText = 'Create Account';
        btn.innerText = 'Register';
        toggle.innerHTML = 'Already have an account? <a onclick="setAuthMode(\'login\')" style="color:var(--primary); cursor:pointer">Login</a>';
        signupFields.style.display = 'block';
    } else {
        title.innerText = 'Welcome Back';
        btn.innerText = 'Sign In';
        toggle.innerHTML = 'First time here? <a onclick="setAuthMode(\'signup\')" style="color:var(--primary); cursor:pointer">Create Account</a>';
        signupFields.style.display = 'none';
    }
}

async function handleAuth(event) {
    event.preventDefault();
    const mode = document.getElementById('auth-mode').value;
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');

    const authData = { username, password };
    if (mode === 'signup') {
        authData.full_name = document.getElementById('auth-fullname').value.trim();
        authData.email = document.getElementById('auth-email').value.trim();
        authData.phone = document.getElementById('auth-phone').value.trim();
        
        if (!authData.full_name || !authData.email || !authData.phone || !username || !password) {
            errorEl.innerText = 'Please fill all registration fields.';
            return;
        }

        // 1. Email validation: must contain @gmail.com
        if (!authData.email.toLowerCase().endsWith('@gmail.com')) {
            errorEl.innerText = '❌ Email must be a valid @gmail.com address.';
            return;
        }

        // 2. Phone validation: exactly 10 digits
        const phoneDigits = authData.phone.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
            errorEl.innerText = '❌ Phone number must be exactly 10 digits.';
            return;
        }

        // 3. Password validation: atleast 4 characters
        if (password.length < 4) {
            errorEl.innerText = '❌ Password must be at least 4 characters long.';
            return;
        }
    }

    try {
        const response = await fetch(`${API_URL}/${mode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authData)
        });
        const data = await response.json();

        if (response.ok) {
            if (mode === 'signup') {
                alert('✅ Account created successfully!');
                setAuthMode('login');
            } else {
                localStorage.setItem('logged_in', 'true');
                localStorage.setItem('username', data.username || username);
                
                // Save additional details returned from login
                if (data.full_name) localStorage.setItem('user_full_name', data.full_name);
                if (data.email) localStorage.setItem('user_email', data.email);
                if (data.phone) localStorage.setItem('user_phone', data.phone);
                
                enterApp();
            }
        } else {
            errorEl.innerText = data.error;
        }
    } catch (err) {
        errorEl.innerText = 'Connection error.';
    }
}

function enterApp() {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    const activeUser = localStorage.getItem('username');
    if (activeUser) {
        document.getElementById('dropdown-username').innerText = activeUser;
        document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${activeUser}&background=f97316&color=fff`;
    }

    loadMovies();
    loadSavedSettings();
}

function loadSavedSettings() {
    const savedName = localStorage.getItem('user_full_name');
    const savedEmail = localStorage.getItem('user_email');
    const savedPhone = localStorage.getItem('user_phone');
    const savedCity = localStorage.getItem('user_city');
    const savedAvatar = localStorage.getItem('user_avatar_base64');

    if (savedName) {
        document.getElementById('settings-name-input').value = savedName;
        document.getElementById('settings-username-display').innerText = savedName;
        document.getElementById('dropdown-username').innerText = savedName;
    }
    if (savedEmail) {
        document.getElementById('settings-email-input').value = savedEmail;
        document.getElementById('settings-email-display').innerText = savedEmail;
        const googleSpan = document.getElementById('settings-google-email');
        if (googleSpan) googleSpan.innerText = `Connected as ${savedEmail}`;
    }
    if (savedPhone) document.getElementById('settings-phone-input').value = savedPhone;
    if (savedCity) {
        document.getElementById('settings-city-input').value = savedCity;
        document.getElementById('location-name').innerText = savedCity;
    }
    if (savedAvatar) {
        document.getElementById('settings-avatar-preview').src = savedAvatar;
        document.getElementById('user-avatar').src = savedAvatar;
    }
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        localStorage.setItem('user_avatar_base64', base64);
        document.getElementById('settings-avatar-preview').src = base64;
        document.getElementById('user-avatar').src = base64;
        alert('✅ Profile picture updated!');
    };
    reader.readAsDataURL(file);
}

function saveAccountSettings() {
    const name = document.getElementById('settings-name-input').value;
    const email = document.getElementById('settings-email-input').value;
    const phone = document.getElementById('settings-phone-input').value;

    localStorage.setItem('user_full_name', name);
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_phone', phone);
    
    // Update UI immediately
    document.getElementById('settings-username-display').innerText = name;
    document.getElementById('settings-email-display').innerText = email;
    document.getElementById('dropdown-username').innerText = name;
    
    alert('✅ Account settings saved successfully!');
}

function saveAppPreferences() {
    const city = document.getElementById('settings-city-input').value;
    const lang = document.getElementById('settings-lang-input').value;
    
    localStorage.setItem('user_city', city);
    localStorage.setItem('user_lang', lang);
    
    document.getElementById('location-name').innerText = city;
    // Log to console for now as feedback
    console.log('App preferences saved:', { city, lang });
}

function toggleProfile() {
    const dropdown = document.getElementById('profile-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-profile-container')) {
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
});

function initBackgroundWall(posters) {
    const wall = document.getElementById('bg-wall');
    if (!wall || posters.length === 0) return;

    wall.innerHTML = '';
    // Generate ~300 posters to fill the grid
    for (let i = 0; i < 300; i++) {
        const img = document.createElement('img');
        img.src = posters[i % posters.length];
        img.loading = 'lazy';
        img.onerror = () => { img.src = PLACEHOLDER_POSTER; };
        wall.appendChild(img);
    }
}

function logout() {
    localStorage.removeItem('logged_in');
    location.reload();
}

// =============================================
// NAVIGATION & LOADING
// =============================================
let navHistory = [];

function showTab(name) {
    const mainTabs = ['home', 'upcoming', 'history', 'now-showing'];
    const currentTab = document.querySelector('.tab[style*="display: block"]');
    const currentName = currentTab ? currentTab.id.replace('tab-', '') : null;

    // Track history for the back button
    if (currentName && !mainTabs.includes(name) && currentName !== name) {
        navHistory.push(currentName);
    } else if (mainTabs.includes(name)) {
        navHistory = []; // Clear history when returning to a main tab
    }

    document.querySelectorAll('.tab').forEach(t => t.style.display = 'none');
    const targetTab = document.getElementById('tab-' + name);
    if (targetTab) targetTab.style.display = 'block';

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const link = document.getElementById('link-' + name);
    if (link) link.classList.add('active');

    // Show/Hide Global Back Button
    const backBtn = document.getElementById('global-back-btn');
    if (backBtn) {
        backBtn.style.display = mainTabs.includes(name) ? 'none' : 'flex';
    }

    if (name === 'history') loadBookings();
    if (name === 'upcoming') loadUpcomingMovies();
    if (name === 'settings') {
        switchSettingsPane('account', document.querySelector('.settings-nav-btn'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBackTab() {
    if (navHistory.length > 0) {
        const prev = navHistory.pop();
        showTab(prev);
    } else {
        showTab('home');
    }
}

function switchSettingsPane(paneId, btn) {
    document.querySelectorAll(".settings-pane").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".settings-nav-btn").forEach(b => b.classList.remove("active"));

    const targetPane = document.getElementById("set-" + paneId);
    if (targetPane) targetPane.classList.add("active");
    if (btn) btn.classList.add("active");
}

async function loadMovies() {
    try {
        // Fetch ALL movies (both now_showing and upcoming) for search and filtering
        const response = await fetch(`${API_URL}/movies`);
        allMovies = await response.json();

        // For the home grid and hero slider, we initially only show movies that are already released
        const today = new Date().toISOString().split('T')[0];
        const nowShowing = allMovies.filter(m => m.release_date <= today);

        const heroItems = nowShowing.slice(0, 5);
        if (heroItems.length > 0) {
            setupHeroSlider(heroItems);
        }

        // Setup Genre Chips (based on all movies)
        const genres = ['All', ...new Set(allMovies.map(m => m.genre))];
        const genreContainer = document.getElementById('genre-container');
        if (genreContainer) {
            genreContainer.innerHTML = genres.map(g =>
                `<button class="genre-chip" onclick="filterGenre('${g}')" style="background:var(--bg-card); border:1px solid var(--border); color:#fff; padding:8px 20px; border-radius:20px; cursor:pointer; white-space:nowrap; transition:0.3s;">${g}</button>`
            ).join('');
        }

        renderMovieGrid(nowShowing);
        renderMostBooked();
        initBackgroundWall(allMovies.map(m => m.poster_url));
    } catch (err) {
        console.error('Failed to load movies', err);
    }
}

let upcomingLoaded = false;
async function loadUpcomingMovies() {
    if (upcomingLoaded) return;
    const grid = document.getElementById('upcoming-grid');
    if (!grid) return;
    grid.innerHTML = `<div class="loader"></div>`;
    try {
        const response = await fetch(`${API_URL}/upcoming-movies`);
        const movies = await response.json();
        upcomingLoaded = true;
        renderUpcomingGrid(movies, grid);
    } catch (err) {
        grid.innerHTML = '<p style="color:#ff5252">Failed to load upcoming movies.</p>';
    }
}

function renderUpcomingGrid(movies, grid) {
    if (!grid) return;
    if (!movies || movies.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted)">No upcoming movies found.</p>';
        return;
    }
    grid.innerHTML = '';
    movies.forEach(movie => {
        const stats = getMovieStats(movie);
        const card = document.createElement('div');
        card.className = 'movie-card upcoming-card';
        card.style.cssText = 'position:relative; cursor:default;';

        const poster = createPosterImage(movie.poster_url, movie.title, 'movie-poster');

        // Upcoming badge overlay
        const badge = document.createElement('div');
        badge.style.cssText = 'position:absolute; top:10px; left:10px; background:linear-gradient(135deg,#f97316,#fb923c); color:#000; font-size:0.65rem; font-weight:800; padding:4px 10px; border-radius:12px; letter-spacing:0.5px; z-index:2;';
        badge.innerText = 'COMING SOON';

        const info = document.createElement('div');
        info.className = 'movie-info';

        const name = document.createElement('div');
        name.className = 'movie-name';
        name.innerText = movie.title;

        // Release date
        const releaseDate = movie.release_date ? new Date(movie.release_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA';
        const meta = document.createElement('div');
        meta.className = 'movie-meta';
        meta.innerHTML = `<span>${movie.genre}</span><span style="color:var(--primary); font-weight:600;"><i class="fas fa-calendar-alt"></i> ${releaseDate}</span>`;

        const desc = document.createElement('p');
        desc.style.cssText = 'font-size:0.78rem; color:var(--text-muted); margin:8px 0 0; line-height:1.5;';
        desc.innerText = movie.description ? movie.description.substring(0, 90) + '...' : '';

        info.appendChild(name);
        info.appendChild(meta);
        info.appendChild(desc);
        card.appendChild(badge);
        card.appendChild(poster);
        card.appendChild(info);
        grid.appendChild(card);
    });
}

function setupHeroSlider(items) {
    heroIndex = 0;
    const dots = document.getElementById('hero-dots');
    dots.innerHTML = items.map((_, index) => `<button class="${index === 0 ? 'active' : ''}" onclick="setHeroSlide(${index})"></button>`).join('');
    const advance = () => setHeroSlide(heroIndex + 1);
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(advance, 8000);
    setHeroSlide(0, items);
}

function setHeroSlide(index, items = allMovies.slice(0, 5)) {
    const slides = items.length ? items : allMovies.slice(0, 5);
    if (!slides.length) return;
    heroIndex = (index + slides.length) % slides.length;
    const movie = slides[heroIndex];
    const heroSlider = document.getElementById('hero-slider');
    const heroImage = new Image();
    heroImage.src = movie.poster_url;
    heroImage.onload = () => heroSlider.style.backgroundImage = `url(${movie.poster_url})`;
    heroImage.onerror = () => heroSlider.style.backgroundImage = `url(${PLACEHOLDER_POSTER})`;
    document.getElementById('hero-title').innerText = movie.title;
    document.getElementById('hero-desc').innerText = movie.description.substring(0, 150) + '...';
    document.getElementById('hero-btn').onclick = () => openMovie(movie.id);
    document.querySelectorAll('#hero-dots button').forEach((dot, idx) => {
        dot.classList.toggle('active', idx === heroIndex);
    });
}

function prevHero() {
    setHeroSlide(heroIndex - 1);
}

function nextHero() {
    setHeroSlide(heroIndex + 1);
}

function detectLocation() {
    if (!navigator.geolocation) {
        alert('Location access is not supported in your browser.');
        return;
    }
    navigator.geolocation.getCurrentPosition(async position => {
        const { latitude, longitude } = position.coords;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.state || 'your area';
            selectCity(city);
        } catch (err) {
            selectCity(`Lat ${latitude.toFixed(2)}, Lon ${longitude.toFixed(2)}`);
        }
    }, () => {
        alert('Location permission denied. Showing default city.');
    });
}

// =============================================
// LOCATION MODAL LOGIC
// =============================================
const popularCities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Chandigarh', 'Kochi', 'Jaipur', 'Lucknow'];
let nominatimTimer = null;

function openLocationModal() {
    document.getElementById('location-modal').classList.add('active');
    document.getElementById('city-search').value = '';
    renderCityList(popularCities.map(c => ({ display: c })));
    setTimeout(() => document.getElementById('city-search').focus(), 100);
}

function closeLocationModal() {
    document.getElementById('location-modal').classList.remove('active');
}

function renderCityList(cities) {
    const list = document.getElementById('city-list');
    if (!cities.length) {
        list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:40px;">No results found. Try a different name.</p>';
        return;
    }
    list.innerHTML = cities.map(c => {
        const safeDisplay = c.display.replace(/'/g, '&#39;');
        return `
        <button class="city-btn" onclick="selectCity('${safeDisplay}')">
            <div class="city-info">
                <span class="city-name">${c.display}</span>
                ${c.subtitle ? `<span class="city-subtitle">${c.subtitle}</span>` : ''}
            </div>
            <i class="fas fa-chevron-right" style="color:var(--primary); font-size:0.9rem;"></i>
        </button>`;
    }).join('');
}

async function filterCities() {
    const query = document.getElementById('city-search').value.trim();
    if (!query) {
        renderCityList(popularCities.map(c => ({ display: c })));
        return;
    }
    if (query.length < 2) {
        const filtered = popularCities.filter(c => c.toLowerCase().startsWith(query.toLowerCase()));
        renderCityList(filtered.map(c => ({ display: c })));
        return;
    }
    document.getElementById('city-list').innerHTML = `
        <div style="text-align:center; padding:60px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:16px;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--primary);"></i>
            <span style="font-weight:600; letter-spacing:1px;">Searching Global Locations...</span>
        </div>`;
    clearTimeout(nominatimTimer);
    nominatimTimer = setTimeout(async () => {
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1`;
            const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
            const data = await res.json();
            if (!data.length) { renderCityList([]); return; }
            const seen = new Set();
            const results = data.map(item => {
                const addr = item.address || {};
                const display = addr.city || addr.town || addr.village || addr.county || item.display_name.split(',')[0];
                const subtitle = [addr.state, addr.country].filter(Boolean).join(', ');
                return { display, subtitle };
            }).filter(r => {
                // Fuzzy deduplication: ignore minor spelling variations and case by using a normalized key
                const normalizedCity = r.display.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6);
                const key = `${normalizedCity}|${r.subtitle.toLowerCase()}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            renderCityList(results);
        } catch (e) {
            renderCityList(popularCities.filter(c => c.toLowerCase().includes(query.toLowerCase())).map(c => ({ display: c })));
        }
    }, 400);
}

function selectCity(city) {
    document.getElementById('location-name').innerText = city;
    closeLocationModal();
}

function renderMovieGrid(movies) {
    const grid = document.getElementById('movie-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (movies.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 100px 20px; color: var(--text-muted);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <h2 style="font-size: 1.5rem; color: #fff;">No movie with that name found</h2>
                <p style="margin-top: 10px;">Try searching for a different title or genre.</p>
                <button class="btn-secondary" style="margin-top: 25px;" onclick="searchMovies(''); document.querySelector('.search-bar input').value=''">View All Movies</button>
            </div>
        `;
        return;
    }

    movies.forEach(movie => {
        const stats = getMovieStats(movie);
        const today = new Date().toISOString().split('T')[0];
        const isUpcoming = movie.release_date > today;
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        if (isUpcoming) card.classList.add('upcoming-item');
        
        card.onclick = () => {
            if (isUpcoming) {
                alert('This movie is coming soon! Check back on ' + new Date(movie.release_date).toDateString() + ' for tickets.');
            } else {
                openMovie(movie.id);
            }
        };

        const poster = createPosterImage(movie.poster_url, movie.title, 'movie-poster');
        
        // Add "Coming Soon" badge for search results that are upcoming
        if (isUpcoming) {
            const badge = document.createElement('div');
            badge.style.cssText = 'position:absolute; top:10px; right:10px; background:var(--primary); color:#000; font-size:0.7rem; font-weight:800; padding:4px 10px; border-radius:20px; z-index:2; box-shadow: 0 4px 10px rgba(0,0,0,0.5);';
            badge.innerText = 'COMING SOON';
            card.appendChild(badge);
        }

        const info = document.createElement('div');
        info.className = 'movie-info';

        const name = document.createElement('div');
        name.className = 'movie-name';
        name.innerText = movie.title;

        const meta = document.createElement('div');
        meta.className = 'movie-meta';
        meta.innerHTML = `<span>${movie.genre}</span><span class="rating"><i class="fas fa-star"></i> ${stats.rating}/10</span>`;

        info.appendChild(name);
        info.appendChild(meta);
        card.appendChild(poster);
        card.appendChild(info);
        grid.appendChild(card);
    });
}

function searchMovies(query) {
    const filtered = allMovies.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
    renderMovieGrid(filtered);
}

function filterGenre(genre) {
    const today = new Date().toISOString().split('T')[0];
    const filtered = allMovies.filter(m => {
        const isReleased = m.release_date <= today;
        const matchesGenre = genre === 'All' || m.genre === genre;
        return isReleased && matchesGenre;
    });
    renderMovieGrid(filtered);
}

function renderReviews(reviews) {
    const list = document.getElementById('review-list');
    if (!list) return;
    list.innerHTML = reviews.map(review => `
        <div class="review-card" style="background:var(--bg-surface); padding:15px; border-radius:10px; border:1px solid var(--border);">
            <strong style="color:var(--text-main); font-size:0.9rem;">${review.name} • <span style="color:var(--primary)">${'★'.repeat(review.stars)}${'☆'.repeat(5 - review.stars)}</span></strong>
            <p style="margin-top:8px; font-size:0.85rem; color:var(--text-muted); font-style:italic;">"${review.text}"</p>
        </div>
    `).join('');
}

async function renderMostBooked() {
    const section = document.getElementById('most-booked-section');
    const card = document.getElementById('most-booked-card');

    try {
        const response = await fetch(`${API_URL}/bookings`);
        const bookings = await response.json();
        const countMap = {};
        bookings.forEach(b => {
            countMap[b.movie_title] = (countMap[b.movie_title] || 0) + 1;
        });

        const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) {
            section.style.display = 'none';
            return;
        }

        const [movieTitle, bookingCount] = sorted[0];
        const movie = allMovies.find(m => m.title === movieTitle) || allMovies[0];
        const stats = getMovieStats(movie);

        section.style.display = 'block';
        card.innerHTML = `
            <div class="movie-card">
                <img class="movie-poster" src="${movie.poster_url}" onerror="this.src='${PLACEHOLDER_POSTER}'" alt="${movie.title}">
                <div class="movie-info">
                    <div class="movie-name">${movie.title}</div>
                    <div class="movie-meta"><span>${movie.genre}</span><span class="rating"><i class="fas fa-star"></i> ${stats.rating}/10</span></div>
                    <p style="color:var(--text-muted); margin:12px 0 8px;">Most booked movie with ${bookingCount} confirmed tickets.</p>
                    <button class="btn-primary" style="width:100%;" onclick="openMovie(${movie.id})">View Showtimes</button>
                </div>
            </div>
        `;
    } catch (err) {
        section.style.display = 'none';
    }
}

// =============================================
// MOVIE MODAL & BOOKING FLOW
// =============================================
async function openMovie(movieId) {
    currentMovie = allMovies.find(m => m.id === movieId);
    const modal = document.getElementById('movie-modal');

    // Reset Modal State
    document.getElementById('seat-selection-step').style.display = 'none';
    document.getElementById('payment-panel').style.display = 'none';
    document.getElementById('proceed-btn').style.display = 'block';
    selectedSeats = [];
    selectedPaymentMethod = null;
    updateSummary();

    // Fill Sidebar
    const sidebar = document.getElementById('modal-sidebar');
    sidebar.innerHTML = '';
    const poster = createPosterImage(currentMovie.poster_url, currentMovie.title, 'modal-poster');
    const details = document.createElement('div');
    details.style.marginTop = '20px';
    details.innerHTML = `
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">GENRE</p>
        <p style="font-weight:600;">${currentMovie.genre}</p>
    `;
    sidebar.appendChild(poster);
    sidebar.appendChild(details);

    document.getElementById('modal-title').innerText = currentMovie.title;
    const stats = getMovieStats(currentMovie);
    document.getElementById('modal-stats').innerHTML = `
        <span><i class="fas fa-star"></i> ${stats.rating}/10</span>
        <span><i class="fas fa-heart"></i> ${stats.likes.toLocaleString()} likes</span>
    `;
    document.getElementById('modal-description').innerText = currentMovie.description;
    renderReviews(stats.reviews);

    // Fetch Shows & Group by Theater
    try {
        const response = await fetch(`${API_URL}/shows`);
        const shows = await response.json();
        const movieShows = shows.filter(s => s.movie_id === movieId);

        // Generate multi-dates
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 5; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            dates.push({ label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayStr, key: d.toISOString().split('T')[0] });
        }

        let selectedDate = dates[0].key;
        const rootOptions = document.getElementById('show-options');
        const dateSelector = document.getElementById('date-selector');

        const renderDates = () => {
            dateSelector.innerHTML = dates.map(d => `
                <button onclick="window.selectDate('${d.key}')" style="background:${d.key === selectedDate ? 'var(--primary)' : 'var(--bg-surface)'}; border:1px solid ${d.key === selectedDate ? 'var(--primary)' : 'var(--border)'}; color:#fff; padding:10px 18px; border-radius:10px; cursor:pointer; white-space:nowrap; font-weight:600; transition:0.3s;">
                    ${d.label}
                </button>
            `).join('');
        };

        window.selectDate = (dateKey) => {
            selectedDate = dateKey;
            renderDates();
            renderTheatersForSelectedDate();
        };

        const renderTheatersForSelectedDate = () => {
            if (movieShows.length === 0) {
                rootOptions.innerHTML = '<p style="color:var(--text-muted)">No shows available for this movie.</p>';
                return;
            }

            // Grouping & Localization Logic
            const theaters = {};
            const currentCity = document.getElementById('location-name').innerText.trim() || 'Mumbai';
            
            // Random sub-locations for fallback cities
            const randomAreas = ['City Centre', 'Main Square', 'Galaxy Mall', 'Orion Hub', 'Grand Plaza', 'High Street', 'Elite Arcade', 'The Junction'];
            const theaterBrands = ['PVR', 'INOX', 'Cinepolis', 'Miraj Cinemas', 'Carnival Cinemas'];

            movieShows.forEach(s => {
                let name = s.theater_name;
                const cityLower = currentCity.toLowerCase();
                const randomArea = randomAreas[Math.floor(Math.random() * randomAreas.length)];

                if (cityLower.includes('mumbai')) {
                    if (name.includes('PVR')) name = 'PVR: Juhu, Mumbai';
                    else if (name.includes('INOX')) name = 'INOX: Nariman Point, Mumbai';
                    else if (name.includes('Cinepolis')) name = 'Cinepolis: Andheri, Mumbai';
                } else if (cityLower.includes('delhi')) {
                    if (name.includes('PVR')) name = 'PVR: Select Citywalk, Delhi';
                    else if (name.includes('INOX')) name = 'INOX: Nehru Place, Delhi';
                    else if (name.includes('Cinepolis')) name = 'Cinepolis: DLF Avenue, Delhi';
                } else if (cityLower.includes('hyderabad')) {
                    if (name.includes('PVR')) name = 'PVR: Inorbit Mall, Hyderabad';
                    else if (name.includes('INOX')) name = 'AMB Cinemas, Gachibowli';
                    else if (name.includes('Cinepolis')) name = 'Prasads IMAX, Hyderabad';
                } else if (cityLower.includes('chennai')) {
                    if (name.includes('PVR')) name = 'PVR: VR Mall, Chennai';
                    else if (name.includes('INOX')) name = 'Sathyam Cinemas, Chennai';
                    else if (name.includes('Cinepolis')) name = 'Cinepolis: BSR Mall, Chennai';
                } else if (cityLower.includes('bengaluru') || cityLower.includes('bangalore')) {
                    if (name.includes('PVR')) name = 'PVR: Forum Mall, Koramangala';
                    else if (name.includes('INOX')) name = 'INOX: Garuda Mall, Bengaluru';
                    else if (name.includes('Cinepolis')) name = 'Cinepolis: Orion Mall, Bengaluru';
                } else {
                    // Dynamic fallback: Map the generic DB theater name to a localized random version
                    if (name.includes('PVR')) name = `PVR: ${randomArea}, ${currentCity}`;
                    else if (name.includes('INOX')) name = `INOX: ${randomArea}, ${currentCity}`;
                    else if (name.includes('Cinepolis')) name = `Cinepolis: ${randomArea}, ${currentCity}`;
                    else name = `${s.theater_name}: ${randomArea}, ${currentCity}`;
                }

                if (!theaters[name]) theaters[name] = [];
                // Push the show simulating it for the selectedDate
                const virtualShow = { ...s, virtual_date: selectedDate };
                theaters[name].push(virtualShow);
            });

            rootOptions.innerHTML = Object.entries(theaters).map(([name, ts]) => `
                <div class="theater-group">
                    <div class="theater-name">${name}</div>
                    <div style="display:flex; gap:12px; flex-wrap:wrap;">
                        ${ts.map(s => `
                            <button class="show-chip" onclick="selectShow(${s.id}, this, '${name}')" style="background:#222; border:1px solid #333; color:#fff; padding:10px 18px; border-radius:8px; cursor:pointer; min-width:80px; text-align:center;">
                                <div style="font-weight:700;">${s.show_time.substring(0, 5)}</div>
                                <div style="font-size:0.7rem; color:var(--text-muted)">4K / Atmos</div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        };

        renderDates();
        renderTheatersForSelectedDate();
    } catch (err) {
        console.error('Failed to load shows');
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('movie-modal').classList.remove('active');
    currentDiscount = 0;
    if (document.getElementById('promo-input')) document.getElementById('promo-input').value = '';
    if (document.getElementById('promo-msg')) document.getElementById('promo-msg').style.display = 'none';
}

async function selectShow(showId, btn, theaterName) {
    currentShow = { id: showId, theater: theaterName };
    currentDiscount = 0;
    if (document.getElementById('promo-input')) document.getElementById('promo-input').value = '';
    if (document.getElementById('promo-msg')) document.getElementById('promo-msg').style.display = 'none';

    // UI Update
    document.querySelectorAll('.show-chip').forEach(b => {
        b.style.borderColor = '#333';
        b.style.background = '#222';
    });
    btn.style.borderColor = 'var(--primary)';
    btn.style.background = 'rgba(255,140,0,0.1)';

    // Fix Visibility & Scroll
    const step = document.getElementById('seat-selection-step');
    step.style.display = 'block';
    step.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Reset Payment State
    document.getElementById('payment-panel').style.display = 'none';
    document.getElementById('proceed-btn').style.display = 'block';
    selectedPaymentMethod = null;

    // Load Booked Seats
    try {
        const response = await fetch(`${API_URL}/booked-seats/${showId}`);
        const bookedSeats = await response.json();
        renderSeatGrid(bookedSeats, theaterName);
    } catch (err) {
        console.error('Failed to load booked seats');
    }
}

// =============================================
// SEAT GRID LOGIC (TIERED)
// =============================================
function getPriceForClass(className) {
    if (className === 'platinum') return 250;
    if (className === 'gold') return 200;
    return 150; // silver
}

function renderSeatGrid(bookedSeats, theaterName) {
    const grid = document.getElementById('seat-grid');
    grid.innerHTML = '';

    // Build a row: left block | AISLE (marker: 'GAP') | center block | AISLE | right block
    const GAP = 'GAP';
    const makeRow = (left, center, right) => [...left, GAP, ...center, GAP, ...right];
    const seats = (n) => Array.from({ length: n }, (_, i) => String(i + 1));

    const seatSections = [
        {
            key: 'P',
            title: '— REGAL GOLD — ₹250',
            colorClass: 'platinum',
            rows: [
                makeRow(seats(4), seats(8), seats(4)),
                makeRow(seats(4), seats(8), seats(4)),
                makeRow(seats(4), seats(8), seats(4)),
            ]
        },
        {
            key: 'E',
            title: '— EPIC LUXURY — ₹200',
            colorClass: 'gold',
            rows: [
                makeRow(seats(5), seats(10), seats(5)),
                makeRow(seats(5), seats(10), seats(5)),
                makeRow(seats(5), seats(10), seats(5)),
                makeRow(seats(5), seats(10), seats(5)),
                makeRow(seats(5), seats(10), seats(5)),
            ]
        },
        {
            key: 'N',
            title: '— NORMAL — ₹150',
            colorClass: 'silver',
            rows: [
                makeRow(seats(4), seats(8), seats(4)),
                makeRow(seats(4), ['1', '2', '3', { wheelchair: true }, '5', '6', '7', { wheelchair: true }], seats(4)),
            ]
        }
    ];

    let globalRowIndex = 0;

    seatSections.forEach(section => {
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'seat-section-title';
        sectionTitle.innerText = section.title;
        grid.appendChild(sectionTitle);

        section.rows.forEach((row, rowIndex) => {
            const rowWrapper = document.createElement('div');
            rowWrapper.style.cssText = 'display:flex; align-items:center; justify-content:center; gap:0;';

            // Row letter label
            const label = document.createElement('div');
            label.style.cssText = 'width:22px; font-size:0.7rem; color:rgba(255,255,255,0.35); text-align:center; flex-shrink:0; margin-right:4px;';
            label.innerText = String.fromCharCode(65 + globalRowIndex);
            rowWrapper.appendChild(label);

            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';
            rowDiv.style.justifyContent = 'center';

            row.forEach((cell, cellIndex) => {
                if (cell === 'GAP') {
                    // Render a proper wide aisle
                    const aisle = document.createElement('div');
                    aisle.style.cssText = 'width:24px; flex-shrink:0;';
                    rowDiv.appendChild(aisle);
                    return;
                }
                if (cell === null) {
                    const spacer = document.createElement('div');
                    spacer.style.cssText = 'width:36px; flex-shrink:0;';
                    rowDiv.appendChild(spacer);
                    return;
                }

                const isWheelchair = typeof cell === 'object' && cell.wheelchair;
                const seatId = isWheelchair
                    ? `${section.key}${rowIndex + 1}-W${cellIndex}`
                    : `${section.key}${rowIndex + 1}-${cell}`;
                const seatClass = isWheelchair ? 'silver' : section.colorClass;
                const isOccupied = bookedSeats.includes(seatId);

                const seatBtn = document.createElement('div');
                seatBtn.className = `seat ${seatClass} ${isOccupied ? 'occupied' : ''}`;
                seatBtn.innerText = isWheelchair ? '\u267f' : '';
                seatBtn.title = seatId;

                if (!isOccupied && !isWheelchair) {
                    seatBtn.onclick = () => toggleSeat({ id: seatId, price: getPriceForClass(section.colorClass) }, seatBtn);
                }
                rowDiv.appendChild(seatBtn);
            });

            rowWrapper.appendChild(rowDiv);

            // Right row label mirror
            const labelR = document.createElement('div');
            labelR.style.cssText = 'width:22px; font-size:0.7rem; color:rgba(255,255,255,0.35); text-align:center; flex-shrink:0; margin-left:4px;';
            labelR.innerText = String.fromCharCode(65 + globalRowIndex);
            rowWrapper.appendChild(labelR);

            grid.appendChild(rowWrapper);
            globalRowIndex++;
        });
    });

    const screenNote = document.createElement('div');
    screenNote.className = 'screen-label';
    screenNote.style.marginTop = '24px';
    screenNote.innerText = '\u2014 All eyes this way please \u2014';
    grid.appendChild(screenNote);

    const screenDiv = document.createElement('div');
    screenDiv.className = 'screen';
    grid.appendChild(screenDiv);
}

function toggleSeat(seatObj, el) {
    const index = selectedSeats.findIndex(s => s.id === seatObj.id);
    if (index > -1) {
        selectedSeats.splice(index, 1);
        el.classList.remove('selected');
    } else {
        if (selectedSeats.length >= 10) return alert('Max 10 seats allowed');
        selectedSeats.push(seatObj);
        el.classList.add('selected');
    }
    updateSummary();
}
function updateSummary() {
    const totalRaw = selectedSeats.reduce((sum, s) => sum + s.price, 0);
    const total = totalRaw - currentDiscount;
    document.getElementById('summary-price').innerText = `₹${total.toFixed(2)}`;
    if (currentDiscount > 0) {
        document.getElementById('summary-price').innerHTML += ` <small style="text-decoration:line-through; opacity:0.5; font-size:0.8rem;">₹${totalRaw.toFixed(2)}</small>`;
    }
    document.getElementById('summary-seats').innerText = selectedSeats.length > 0
        ? `Seats: ${selectedSeats.map(s => s.id).join(', ')}`
        : 'No seats selected';
}

function showPaymentOptions() {
    if (selectedSeats.length === 0) return alert('Please select at least one seat');
    document.getElementById('payment-panel').style.display = 'block';
    document.getElementById('proceed-btn').style.display = 'none';
    document.getElementById('payment-panel').scrollIntoView({ behavior: 'smooth' });
}

let selectedPaymentMethod = null;
function selectPayment(type, el) {
    selectedPaymentMethod = type;
    document.querySelectorAll('.payment-form').forEach(f => f.style.display = 'none');
    const form = document.getElementById(`pay-${type}`);
    form.style.display = 'flex';

    // Reset all chips
    document.querySelectorAll('.payment-methods .payment-chip').forEach(c => {
        c.style.borderColor = 'var(--border)';
        c.style.background = 'rgba(255,255,255,0.03)';
        c.classList.remove('active-payment');
    });

    // Highlight selected chip
    el.style.borderColor = type === 'upi' ? '#673ab7' : 'var(--primary)';
    el.style.background = type === 'upi' ? 'rgba(103, 58, 183, 0.1)' : 'rgba(249, 115, 22, 0.1)';
    el.classList.add('active-payment');

    // Special handling for PhonePe
    if (type === 'upi') {
        const upiMsg = document.getElementById('upi-verify-msg');
        upiMsg.style.display = 'none';
        document.getElementById('upi-id-input').value = '';
    }
}

let currentDiscount = 0;
function applyPromoCode() {
    const input = document.getElementById('promo-input');
    const msg = document.getElementById('promo-msg');
    const code = input.value.trim().toUpperCase();
    
    if (!code) {
        msg.innerText = 'Please enter a code.';
        msg.style.color = '#ff5252';
        msg.style.display = 'block';
        return;
    }

    const total = selectedSeats.reduce((sum, s) => sum + s.price, 0);
    
    if (code === 'NEON50') {
        currentDiscount = total * 0.5;
        msg.innerText = '🎉 NEON50 Applied: 50% Off!';
        msg.style.color = '#4caf50';
    } else if (code === 'SAVE20') {
        currentDiscount = total * 0.2;
        msg.innerText = '🎉 SAVE20 Applied: 20% Off!';
        msg.style.color = '#4caf50';
    } else if (code === 'FIRST100') {
        currentDiscount = Math.min(total, 100);
        msg.innerText = '🎉 FIRST100 Applied: ₹100 Off!';
        msg.style.color = '#4caf50';
    } else {
        currentDiscount = 0;
        msg.innerText = '❌ Invalid or expired promo code.';
        msg.style.color = '#ff5252';
    }
    
    msg.style.display = 'block';
    updateSummary();
}

function verifyUpi() {
    const upiId = document.getElementById('upi-id-input').value.trim();
    const msg = document.getElementById('upi-verify-msg');

    if (!upiId || !upiId.includes('@')) {
        msg.innerText = '❌ Invalid UPI ID format';
        msg.style.color = '#ff5252';
        msg.style.display = 'block';
        return;
    }

    msg.innerText = '⌛ Verifying...';
    msg.style.color = '#673ab7';
    msg.style.display = 'block';

    setTimeout(() => {
        msg.innerText = '✅ Verified: ' + upiId;
        msg.style.color = '#4caf50';
    }, 1500);
}

async function confirmBooking() {
    if (selectedSeats.length === 0) return alert('Please select at least one seat');
    if (!selectedPaymentMethod) return alert('Please select a payment method');

    if (localStorage.getItem('logged_in') !== 'true') {
        return alert('You must be logged in to book a ticket.');
    }

    let customer_name = localStorage.getItem('username');
    if (!customer_name || customer_name === 'undefined' || customer_name === 'null') {
        customer_name = 'neonCinema Member';
    }

    const btn = document.getElementById('final-pay-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';
    btn.disabled = true;

    try {
        const totalRaw = selectedSeats.reduce((sum, s) => sum + s.price, 0);
        const total = totalRaw - currentDiscount;
        const response = await fetch(`${API_URL}/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                show_id: currentShow.id,
                customer_name: customer_name,
                seat_numbers: selectedSeats.map(s => s.id).join(','),
                total_price: total
            })
        });

        if (response.ok) {
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Payment Successful!';
            btn.style.background = '#4caf50';
            setTimeout(() => {
                alert('🎉 Booking Confirmed!');
                closeModal();
                showTab('history');
            }, 1000);
        } else {
            alert('❌ Booking failed.');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        alert('Server Error.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// =============================================
// BOOKING HISTORY
// =============================================
async function loadBookings() {
    const list = document.getElementById('ticket-list');
    list.innerHTML = `<div class="loader"></div>`;

    try {
        const response = await fetch(`${API_URL}/bookings`);
        const allBookings = await response.json();

        let activeUser = localStorage.getItem('username');
        if (!activeUser || activeUser === 'undefined' || activeUser === 'null') {
            activeUser = 'neonCinema Member';
        }

        const bookings = allBookings.filter(b => 
            b.customer_name.toLowerCase() === activeUser.toLowerCase()
        );

        if (bookings.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted)">No bookings found for your account.</p>';
            return;
        }

        list.innerHTML = bookings.map(b => `
            <div class="ticket-card">
                <div class="ticket-status">CONFIRMED</div>
                <div class="ticket-left" style="background: #fff; padding: 15px; display:flex; align-items:center; justify-content:center;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=neonCinema-BK-${b.booking_id}" style="width: 100%; height: auto; opacity: 1; filter: none;" alt="QR Code">
                </div>
                <div class="ticket-right">
                    <div class="ticket-header">
                        <div class="ticket-movie">${b.movie_title}</div>
                        <div class="ticket-id">#BK-${b.booking_id}</div>
                    </div>
                    <div class="ticket-details">
                        <div>
                            <span class="detail-label">DATE & TIME</span>
                            <strong>${new Date(b.show_date).toDateString()} at ${b.show_time.substring(0, 5)}</strong>
                        </div>
                        <div>
                            <span class="detail-label">SEATS</span>
                            <strong>${b.seat_numbers}</strong>
                        </div>
                        <div>
                            <span class="detail-label">HOLDER</span>
                            <strong>${b.customer_name}</strong>
                        </div>
                        <div>
                            <span class="detail-label">TOTAL PAID</span>
                            <strong style="color:var(--primary)">₹${b.total_price}</strong>
                        </div>
                    </div>
                    <button class="btn-cancel" onclick="cancelBooking(${b.booking_id})" style="margin-top:15px; background:none; border:none; color:#ff5252; cursor:pointer; font-size:0.8rem; text-decoration:underline;">Cancel Ticket</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = '<p style="color:#ff5252">Error loading tickets.</p>';
    }
}

async function cancelBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
        const response = await fetch(`${API_URL}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking_id: id })
        });
        if (response.ok) {
            loadBookings();
        }
    } catch (err) {
        alert('Cancellation failed.');
    }
}

/* =============================================
   SETTINGS MODULE LOGIC
   ============================================= */
function switchSettingsPane(paneId, btn) {
    document.querySelectorAll(".settings-pane").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".settings-nav-btn").forEach(b => b.classList.remove("active"));

    const targetPane = document.getElementById("set-" + paneId);
    if (targetPane) targetPane.classList.add("active");
    if (btn) btn.classList.add("active");
}

/* =============================================
   SUPPORT CHATBOT & APP PERFORMANCE LOGIC
   ============================================= */
function openChat(type) {
    const chat = document.getElementById("chat-bot");
    chat.style.display = "flex";

    let welcomeMsg = "";
    if (type === "faq") welcomeMsg = "I can help with common questions about tickets, refunds, and theater locations.";
    else if (type === "report") welcomeMsg = "Please describe the issue you are facing with your booking. I will analyze it immediately.";
    else welcomeMsg = "Hello! I am neonBot. I have analyzed our current movie database and I am ready to help.";

    addChatMessage(welcomeMsg, "bot");
}

function closeChat() {
    document.getElementById("chat-bot").style.display = "none";
}

function addChatMessage(text, side) {
    const msgArea = document.getElementById("chat-messages");
    const msg = document.createElement("div");
    msg.className = "msg " + side;
    msg.innerText = text;
    msgArea.appendChild(msg);
    msgArea.scrollTop = msgArea.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById("chat-input-field");
    const text = input.value.trim();
    if (!text) return;

    addChatMessage(text, "user");
    input.value = "";

    // Simple "AI" Analysis of Website Data
    setTimeout(() => {
        const lowerText = text.toLowerCase();
        let response = "";

        if (lowerText.includes("movie") || lowerText.includes("playing") || lowerText.includes("watch")) {
            const movieNames = allMovies.map(m => m.title).slice(0, 3).join(", ");
            response = "Currently, we have some great movies like " + movieNames + " and more. Would you like to see the full list in the Home tab?";
        } else if (lowerText.includes("refund") || lowerText.includes("cancel")) {
            response = "Our refund policy allows cancellations up to 2 hours before the show. Refunds are processed within 5-7 business days to your original payment method.";
        } else if (lowerText.includes("theater") || lowerText.includes("location") || lowerText.includes("where")) {
            const currentCity = document.getElementById("location-name").innerText;
            response = "We have several partner theaters in " + currentCity + " including PVR, INOX, and Cinepolis. You can change your city in the Settings under Location.";
        } else if (lowerText.includes("price") || lowerText.includes("cost") || lowerText.includes("ticket")) {
            response = "Ticket prices vary by seat class: Regal Gold (₹250), Epic Luxury (₹200), and Normal (₹150).";
        } else if (lowerText.includes("hello") || lowerText.includes("hi")) {
            response = "Hello! How can I assist your movie booking experience today?";
        } else {
            response = "I am still learning, but I can tell you about our current movies, theater locations in " + document.getElementById("location-name").innerText + ", or our refund policies. What would you like to know?";
        }

        addChatMessage(response, "bot");
    }, 800);
}

function toggleTheme(mode, btn) {
    document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (mode === "light") {
        document.body.classList.add("light-mode");
    } else {
        document.body.classList.remove("light-mode");
    }
}

function clearCache() {
    const btn = event.target;
    const oldText = btn.innerText;
    btn.innerText = "Clearing...";
    btn.disabled = true;

    setTimeout(() => {
        upcomingLoaded = false;
        btn.innerText = "Cache Cleared!";
        btn.style.background = "#10b981";

        setTimeout(() => {
            btn.innerText = oldText;
            btn.style.background = "";
            btn.disabled = false;
            const display = document.getElementById('cache-size-display');
            if (display) display.innerText = "Frees up 0MB of storage";
            alert("App cache and temporary assets have been cleared. The app will reload fresh data on next navigation.");
        }, 1500);
    }, 1200);
}

async function downloadUserData() {
    const user = {
        username: localStorage.getItem('username'),
        full_name: localStorage.getItem('user_full_name'),
        email: localStorage.getItem('user_email'),
        phone: localStorage.getItem('user_phone'),
        city: localStorage.getItem('user_city')
    };

    try {
        const response = await fetch(`${API_URL}/bookings`);
        const allBookings = await response.json();
        const myBookings = allBookings.filter(b => b.customer_name && b.customer_name.toLowerCase() === (user.username || "").toLowerCase());
        
        const data = {
            profile: user,
            bookings: myBookings,
            exported_at: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neonCinema_Data_${user.username || "user"}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('📦 Your data has been compiled and downloaded successfully.');
    } catch (err) {
        alert('Failed to download data.');
    }
}

async function deleteAccount() {
    const username = localStorage.getItem('username');
    if (!username) return;

    const confirm1 = confirm('⚠️ CAUTION: Are you sure you want to delete your account? This action is permanent and cannot be undone.');
    if (!confirm1) return;

    const confirm2 = confirm('Final warning: All your bookings and profile data will be permanently erased. Proceed?');
    if (!confirm2) return;

    try {
        const response = await fetch(`${API_URL}/delete-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (response.ok) {
            alert('Your account has been deleted. We are sorry to see you go.');
            logout();
        } else {
            alert('Failed to delete account. Please try again later.');
        }
    } catch (err) {
        alert('Server error while deleting account.');
    }
}
