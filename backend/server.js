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

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

connectWithRetry(MONGODB_URI);
