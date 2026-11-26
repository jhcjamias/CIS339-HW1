const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { connectWithRetry, isConnected } = require('./config/db');
const { errorHandler } = require('./utils/errors');

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = Number(process.env.PORT) || 3000;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set. Add it to backend/.env (see README).');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// While MongoDB is unreachable, API calls get a clear 503 instead of hanging.
app.use('/api', (req, res, next) => {
    if (!isConnected()) {
        return res.status(503).json({ error: 'The database is unavailable. Please try again shortly.' });
    }
    next();
});

app.use('/api/students', require('./routes/students'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
});

// ---------------------------------------------------------------------------
// Production frontend (Vue build output from `npm run build`)
// ---------------------------------------------------------------------------

const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

// Hashed build assets never change, so browsers may cache them long-term.
app.use(
    '/assets',
    express.static(path.join(DIST_DIR, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }),
);
app.use(express.static(DIST_DIR, { index: false }));

// History-mode fallback: any other GET that wants HTML gets index.html so
// Vue Router can render the route (refreshing /courses must not 404).
app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (!req.accepts('html')) return next();

    if (!fs.existsSync(INDEX_HTML)) {
        return res
            .status(503)
            .type('text')
            .send('The frontend has not been built yet. Run "npm run build" in the project root, then restart the server.');
    }
    res.set('Cache-Control', 'no-cache');
    res.sendFile(INDEX_HTML);
});

app.use((req, res) => {
    res.status(404).type('text').send('Not found.');
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (!fs.existsSync(INDEX_HTML)) {
        console.warn('Frontend build not found. Run "npm run build" to generate frontend/dist.');
    }
});

connectWithRetry(MONGODB_URI);
