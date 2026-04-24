// =============================================
// Movie Tickets Booking - Backend Server
// Simple Node.js + Express + MySQL
// =============================================

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const mysql2p = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// =============================================
// Database Connection
// IMPORTANT: Put your MySQL password below!
// =============================================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'charan',  // <-- PUT YOUR MYSQL PASSWORD HERE
    database: 'movie_booking'
});

db.connect((err) => {
    if (err) {
        console.log('❌ Database connection failed!');
        console.log('👉 Please check your MySQL password in server.js line 27');
        console.log('👉 Also make sure you ran database.sql in MySQL');
        console.error(err.message);
        return;
    }
    console.log('✅ Connected to MySQL database!');
});

// =============================================
// AUTH ROUTES (Signup & Login)
// =============================================

// Check if admin exists
app.get('/check-host', (req, res) => {
    db.query('SELECT COUNT(*) as count FROM users', (err, results) => {
        if (err) return res.json({ hasHost: false, dbError: true });
        res.json({ hasHost: results[0].count > 0 });
    });
});

// Signup - create new admin
app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    // Check if username is taken
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length > 0) {
            return res.status(400).json({ error: 'Username already taken. Please login or try another.' });
        }

        // Create new admin
        db.query('INSERT INTO users (username, password, full_name, email, phone) VALUES (?, ?, ?, ?, ?)',
            [username, password, req.body.full_name, req.body.email, req.body.phone],
            (err) => {
                if (err) return res.status(500).json({ error: 'Failed to create account' });
                res.json({ message: 'Account created successfully!' });
            }
        );
    });
});

// Delete Account
app.post('/delete-account', (req, res) => {
    const { username } = req.body;
    db.query('DELETE FROM users WHERE username = ?', [username], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete account' });
        res.json({ message: 'Account deleted successfully' });
    });
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            if (results.length > 0) {
                const user = results[0];
                res.json({ 
                    message: 'Login successful!', 
                    success: true, 
                    username: user.username,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone
                });
            } else {
                res.status(401).json({ error: 'Wrong username or password', success: false });
            }
        }
    );
});

// =============================================
// MOVIE ROUTES
// =============================================

// Get all movies (optional ?status=now_showing|upcoming)
app.get('/movies', (req, res) => {
    const { status } = req.query;
    let query = 'SELECT * FROM movies';
    const params = [];

    if (status === 'now_showing') {
        query += ' WHERE release_date <= CURDATE()';
    } else if (status === 'upcoming') {
        query += ' WHERE release_date > CURDATE()';
    }

    query += ' ORDER BY release_date ASC';
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Get now showing movies
app.get('/now-showing', (req, res) => {
    db.query("SELECT * FROM movies WHERE release_date <= CURDATE() ORDER BY release_date DESC", (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Get upcoming movies
app.get('/upcoming-movies', (req, res) => {
    db.query("SELECT * FROM movies WHERE release_date > CURDATE() ORDER BY release_date ASC", (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Add a movie
app.post('/movies', (req, res) => {
    const { title, description, poster_url, genre, status, release_date } = req.body;
    db.query('INSERT INTO movies (title, description, poster_url, genre, status, release_date) VALUES (?, ?, ?, ?, ?, ?)',
        [title, description, poster_url || null, genre || null, status || 'now_showing', release_date || null],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Failed to add movie' });
            res.json({ message: 'Movie added!', id: result.insertId });
        }
    );
});

// =============================================
// SHOW ROUTES
// =============================================

// Get all shows (with movie title)
app.get('/shows', (req, res) => {
    const query = `
        SELECT shows.id, shows.movie_id, shows.theater_name, shows.show_date, shows.show_time, 
               movies.title as movie_title
        FROM shows 
        JOIN movies ON shows.movie_id = movies.id
        ORDER BY shows.show_date, shows.show_time
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Add a show
app.post('/shows', (req, res) => {
    const { movie_id, show_date, show_time } = req.body;
    db.query('INSERT INTO shows (movie_id, show_date, show_time) VALUES (?, ?, ?)',
        [movie_id, show_date, show_time],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Failed to add show' });
            res.json({ message: 'Show added!', id: result.insertId });
        }
    );
});

// =============================================
// BOOKING ROUTES
// =============================================

// Book tickets
app.post('/book', (req, res) => {
    const { show_id, customer_name, seat_numbers, total_price } = req.body;
    db.query('INSERT INTO bookings (show_id, customer_name, seat_numbers, total_price) VALUES (?, ?, ?, ?)',
        [show_id, customer_name, seat_numbers, total_price],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Booking failed' });
            }
            res.json({ message: 'Booking confirmed!', booking_id: result.insertId });
        }
    );
});

// Get already booked seats for a show
app.get('/booked-seats/:show_id', (req, res) => {
    const { show_id } = req.params;
    db.query('SELECT seat_numbers FROM bookings WHERE show_id = ?', [show_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        // Flatten all seat numbers into a single array
        let allBooked = [];
        results.forEach(row => {
            if (row.seat_numbers) {
                const seats = row.seat_numbers.split(',').map(s => s.trim());
                allBooked = allBooked.concat(seats);
            }
        });
        res.json(allBooked);
    });
});

// Get all bookings (with movie and show details)
app.get('/bookings', (req, res) => {
    const query = `
        SELECT bookings.id as booking_id, bookings.customer_name, bookings.seat_numbers,
               bookings.total_price, bookings.booking_time, movies.title as movie_title,
               shows.show_date, shows.show_time
        FROM bookings
        JOIN shows ON bookings.show_id = shows.id
        JOIN movies ON shows.movie_id = movies.id
        ORDER BY bookings.booking_time DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Cancel a booking
app.post('/cancel', (req, res) => {
    const { booking_id } = req.body;
    db.query('DELETE FROM bookings WHERE id = ?', [booking_id], (err) => {
        if (err) return res.status(500).json({ error: 'Cancel failed' });
        res.json({ message: 'Booking cancelled!' });
    });
});

// =============================================
// Start Server
// =============================================
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`👁️  Watching database.sql for changes...`);
});

// =============================================
// Auto-Migrate: Watch database.sql for changes
// =============================================
const SQL_FILE = path.join(__dirname, 'database.sql');
let migrateTimeout = null;

fs.watch(SQL_FILE, (eventType) => {
    if (eventType !== 'change') return;
    // Debounce: wait 500ms after last change before migrating
    clearTimeout(migrateTimeout);
    migrateTimeout = setTimeout(async () => {
        console.log('\n📄 database.sql changed — running auto-migration...');
        try {
            const conn = await mysql2p.createConnection({
                host: 'localhost',
                user: 'root',
                password: 'charan',
                multipleStatements: true
            });
            const sql = fs.readFileSync(SQL_FILE, 'utf8');
            await conn.query(sql);
            await conn.end();
            console.log('✅ Auto-migration successful! Website updated.');
        } catch (err) {
            console.error('❌ Auto-migration failed:', err.sqlMessage || err.message);
        }
    }, 500);
});
