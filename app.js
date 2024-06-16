// app.js

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');  // Import the CORS middleware

const app = express();
const port = process.env.PORT || 3000;

// SQLite database setup
const dbPath = path.join(__dirname, 'movie_ticket_booking.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database');

        // Create tables if they don't exist
        db.run(`CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            genre TEXT,
            showtimes TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY,
            movie_id INTEGER,
            user_name TEXT,
            seats TEXT,
            total_price REAL,
            payment_status TEXT DEFAULT 'Pending',
            FOREIGN KEY(movie_id) REFERENCES movies(id)
        )`);
    }
});

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to fetch all movies
app.get('/api/movies', (req, res) => {
    db.all('SELECT * FROM movies', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Route to fetch a specific movie by id
app.get('/api/movies/:id', (req, res) => {
    const movieId = req.params.id;
    db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ message: 'Movie not found' });
            return;
        }
        res.json(row);
    });
});

// Route to handle ticket booking
app.post('/api/bookings', (req, res) => {
    const { movie_id, user_name, seats, total_price } = req.body;
    const seatsArray = seats.split(',').map(seat => seat.trim());

    // Check if the selected seats are available
    db.get('SELECT seats FROM bookings WHERE movie_id = ?', [movie_id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        let bookedSeats = [];
        if (row) {
            bookedSeats = row.seats.split(',');
        }
        const allSeats = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
        const availableSeats = allSeats.filter(seat => !bookedSeats.includes(seat));

        const invalidSeats = seatsArray.filter(seat => !availableSeats.includes(seat));
        if (invalidSeats.length > 0) {
            res.status(400).json({ message: `Seats ${invalidSeats.join(', ')} are already booked or invalid.` });
            return;
        }

        // Insert booking into database
        const query = `INSERT INTO bookings (movie_id, user_name, seats, total_price, payment_status) 
                       VALUES (?, ?, ?, ?, 'Confirmed')`;
        db.run(query, [movie_id, user_name, seatsArray.join(','), total_price], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ 
                id: this.lastID, 
                movie_id, 
                user_name, 
                seats: seatsArray, 
                total_price, 
                payment_status: 'Confirmed' 
            });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
