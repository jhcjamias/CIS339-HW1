const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const RETRY_DELAY_MS = 5000;

// Fail fast on queries while disconnected instead of buffering them forever;
// the API responds with 503 until the database is reachable.
mongoose.set('bufferCommands', false);

function isConnected() {
    return mongoose.connection.readyState === 1;
}

// Creates every collection and index the app needs. Safe to run on every
// startup: existing collections and indexes are left in place, so an empty
// or nonexistent database needs no manual setup.
async function initializeDatabase() {
    const NAMESPACE_EXISTS = 48;
    for (const model of [Student, Course, Enrollment]) {
        try {
            await model.createCollection();
        } catch (error) {
            if (error.code !== NAMESPACE_EXISTS) throw error;
        }
        await model.syncIndexes();
    }

    const removed = await Enrollment.removeOrphans();
    if (removed > 0) {
        console.log(`Removed ${removed} enrollment(s) referencing deleted students or courses.`);
    }
}

// Connects to MongoDB, retrying until it is available, so the server can
// start (and report a clear error) even if MongoDB is launched afterward.
async function connectWithRetry(uri) {
    for (;;) {
        try {
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
            await initializeDatabase();
            hasConnected = true;
            console.log(`Connected to MongoDB database "${mongoose.connection.name}".`);
            return;
        } catch (error) {
            console.error(`MongoDB connection failed (${error.message}).`);
            console.error(`Is MongoDB running at ${uri}? Retrying in ${RETRY_DELAY_MS / 1000}s...`);
            await mongoose.disconnect().catch(() => {});
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
}

// Only report connection drops after a successful startup, not during retries.
let hasConnected = false;
mongoose.connection.on('disconnected', () => {
    if (hasConnected) console.warn('MongoDB disconnected. Waiting for it to come back...');
});
mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected.');
});

module.exports = { connectWithRetry, isConnected };
