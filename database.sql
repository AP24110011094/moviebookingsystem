-- =============================================
-- Movie Tickets Booking Management System
-- Updated: April 2026 — All-new 2026 lineup
-- =============================================

CREATE DATABASE IF NOT EXISTS movie_booking;
USE movie_booking;

-- Clean start
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;

-- Table 1: users (admin login)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(20)
);

-- Table 2: movies (with poster, genre and status)
CREATE TABLE movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    poster_url VARCHAR(500),
    genre VARCHAR(50),
    status ENUM('now_showing', 'upcoming') DEFAULT 'now_showing',
    release_date DATE
);

-- Table 3: shows (movie timings)
CREATE TABLE shows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    theater_name VARCHAR(150) DEFAULT 'Main Screen',
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

-- Table 4: bookings
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    show_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    seat_numbers VARCHAR(500) NOT NULL,
    total_price DECIMAL(10,2) DEFAULT 0,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
);

-- Sample Data (Admin Account)
INSERT INTO users (username, password) VALUES
('testuser_antigravity1', 'testuser_antigravity');

-- =============================================
-- NOW SHOWING MOVIES (2026)
-- =============================================
INSERT INTO movies (title, description, poster_url, genre, status, release_date) VALUES

('Dhurandhar 2: The Revenge', 'Undercover Indian agent Jaskirat Singh Rangi returns to navigate the lethal political networks of Pakistan to seek justice for fallen comrades.', 'https://www.themoviedb.org/t/p/w1280/dI7CjJA4cC92UcKMBnCh5BTDHVQ.jpg', 'Spy Action', 'now_showing', '2026-03-21'),

('Michael', 'A biographical drama based on the life and career of legendary pop icon Michael Jackson.', 'https://www.themoviedb.org/t/p/w1280/3Qud19bBUrrJAzy0Ilm8gRJlJXP.jpg', 'Biography', 'now_showing', '2026-04-18'),

('Captain America: Brave New World', 'Sam Wilson steps fully into the role of Captain America and must navigate a complex international conspiracy threatening global peace.', 'https://www.themoviedb.org/t/p/w1280/4YFyYcUPfrbpj6VpgWh7xoUnwLA.jpg', 'Superhero', 'now_showing', '2025-02-14'),

('Paddington in Peru', 'The beloved bear travels to Peru to visit his beloved Aunt Lucy, only to find himself embroiled in a mystery in the heart of the Amazon jungle.', 'https://www.themoviedb.org/t/p/w1280/aKFDfk3pLUDAsy7PZjP3z9dFLbV.jpg', 'Family', 'now_showing', '2025-02-14'),

('Dacoit', 'A Telugu heist and robbery based action drama starring Adivi Sesh.', 'https://www.themoviedb.org/t/p/w1280/lbrnJY7E0a9xxgj2cotNp6YI4dz.jpg', 'Action', 'now_showing', '2026-04-10'),

('Snow White', 'A live-action reimagining of the timeless fairy tale, following Snow White as she discovers her inner strength and bravery.', 'https://www.themoviedb.org/t/p/w1280/xWWg47tTfparvjK0WJNX4xL8lW2.jpg', 'Fantasy', 'now_showing', '2026-01-24'),

('Thunderbolts*', 'A ragtag group of Marvel antiheroes and villains are sent on a dangerous mission that will force them to question who they really are.', 'https://www.themoviedb.org/t/p/w1280/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg', 'Superhero', 'now_showing', '2026-02-02'),

('Project Hail Mary', 'A lone astronaut on a desperate mission to save humanity from extinction.', 'https://www.themoviedb.org/t/p/w1280/yihdXomYb5kTeSivtFndMy5iDmf.jpg', 'Sci-Fi', 'now_showing', '2026-03-20'),

('Crime 101', 'When an elusive thief whose high-stakes heists unfold along the iconic 101 freeway in Los Angeles eyes the score of a lifetime.', 'https://www.themoviedb.org/t/p/w1280/tVvpFIoteRHNnoZMhdnwIVwJpCA.jpg', 'Crime', 'now_showing', '2026-02-13'),

('Om Shanti Shanti Shantihi', 'A Telugu drama starring Tharun Bhascker Dhaassyam and Eesha Rebba.', 'https://www.themoviedb.org/t/p/w1280/mALSJGjgjohkv56pZzpPJL2MOuj.jpg', 'Drama', 'now_showing', '2026-01-30'),

('Gandhi Talks', 'An Indian silent dark comedy drama featuring Vijay Sethupathi.', 'https://www.themoviedb.org/t/p/w1280/4VWUjjsIJGnfD6YeP6Yg6rFXWJG.jpg', 'Drama', 'now_showing', '2026-01-30'),

-- =============================================
-- UPCOMING MOVIES (2026 – Later This Year)
-- =============================================
('Avengers: Doomsday', 'The Avengers assemble once again as Doctor Doom emerges as a multiversal threat.', 'https://www.themoviedb.org/t/p/w1280/s2Fkuq0tj7mjAHEdbfQkFkdbeRI.jpg', 'Superhero', 'upcoming', '2026-12-18'),

('Dune: Part Three', 'Paul Atreides faces the consequences of his rule in the final chapter of the Dune saga.', 'https://www.themoviedb.org/t/p/w1280/fsttvmDGV5Z7iBvA7E3p5CoP8MW.jpg', 'Sci-Fi', 'upcoming', '2026-12-18'),

('Spider-Man: Brand New Day', 'Peter Parker struggles to rebuild his life while facing new enemies in a changed world.', 'https://www.themoviedb.org/t/p/w1280/pspkSVP39NGa6G2rvK5KlMjvYUe.jpg', 'Superhero', 'upcoming', '2026-07-31'),

('Varanasi', 'A mystical drama set in the spiritual city of Varanasi, exploring life, death, and destiny.', 'https://www.themoviedb.org/t/p/w1280/9XHgX5XEQt95nwZIlp2yiMaw65D.jpg', 'Drama', 'upcoming', '2027-04-07'),

('Spirit', 'A high-intensity action drama starring Prabhas, centered around a fierce and disciplined police officer.', 'https://www.themoviedb.org/t/p/w1280/5N3e8nCYZdOyEyh1IuQDdkKF9sQ.jpg', 'Action', 'upcoming', '2027-03-05'),

('Peddi', 'A sports drama featuring Ram Charan in a powerful role centered around ambition and resilience.', 'https://www.themoviedb.org/t/p/w1280/AiBszxYkCeEMBcznz6x3HdGVLqc.jpg', 'Drama', 'upcoming', '2026-06-25'),

('Ek Din', 'A romantic drama that unfolds over a single day, exploring love and destiny starring Junaid Khan.', 'https://www.themoviedb.org/t/p/w1280/yYkJylaY1TJT9iEBkWnc2Tiw6jN.jpg', 'Romance', 'upcoming', '2026-05-01'),

('The Paradise', 'An intense action drama featuring Nani in a gritty and emotional storyline.', 'https://www.themoviedb.org/t/p/w1280/smghVMoMWSIFi5dgIz4w1UIcEcY.jpg', 'Action', 'upcoming', '2026-08-21'),

('Ranabaali', 'A high-energy action film starring Vijay Deverakonda and Rashmika Mandanna.', 'https://www.themoviedb.org/t/p/w1280/rMg3BFUKs8IaekSJgMT1IYmypk.jpg', 'Action', 'upcoming', '2026-09-11'),

('Rowdy Janardhana', 'A commercial entertainer featuring Vijay Deverakonda in a powerful role.', 'https://www.themoviedb.org/t/p/w1280/cq0cz2Sw0ACgwgTBpg3vHnC6yni.jpg', 'Action', 'upcoming', '2026-12-01');
-- =============================================
-- Shows for NOW SHOWING movies
-- =============================================
INSERT INTO shows (movie_id, theater_name, show_date, show_time)
SELECT id, 'PVR: ICON', CURDATE(), '10:00:00' FROM movies WHERE status = 'now_showing'
UNION ALL
SELECT id, 'INOX: City Centre', CURDATE(), '14:30:00' FROM movies WHERE status = 'now_showing'
UNION ALL
SELECT id, 'Cinepolis: Grand Mall', CURDATE(), '19:00:00' FROM movies WHERE status = 'now_showing'
UNION ALL
SELECT id, 'PVR: Orion', CURDATE(), '22:15:00' FROM movies WHERE status = 'now_showing';

-- Sample Bookings
INSERT INTO bookings (show_id, customer_name, seat_numbers, total_price) VALUES
(1, 'testuser_antigravity1', 'P1-3,P1-4', 500.00),
(4, 'testuser_antigravity1', 'E1-5,E1-6,E1-7', 600.00);
