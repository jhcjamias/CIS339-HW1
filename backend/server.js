const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'students.json');

// ---------------------------------------------------------------------------
// Storage helpers (JSON file; replaced by MongoDB in a later requirement)
// ---------------------------------------------------------------------------

async function loadStudents() {
    try {
        const data = await fs.promises.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function saveStudents(students) {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(students, null, 2), 'utf8');
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const STUDENT_FIELDS = {
    name: { label: 'Name', pattern: null, message: '' },
    id: { label: 'Student ID', pattern: /^\d+$/, message: 'Student ID must contain digits only.' },
    phone: { label: 'Phone', pattern: /^[\d\s()+-]{7,20}$/, message: 'Enter a valid phone number (e.g. 555-1234).' },
    zip: { label: 'ZIP code', pattern: /^\d{5}(-\d{4})?$/, message: 'ZIP code must be 5 digits (or ZIP+4).' },
};

// Returns { student, errors } where errors maps field name -> message.
function validateStudent(body = {}) {
    const student = {};
    const errors = {};

    for (const [field, rule] of Object.entries(STUDENT_FIELDS)) {
        const raw = body[field];
        const value = raw === undefined || raw === null ? '' : String(raw).trim();
        student[field] = value;

        if (!value) {
            errors[field] = `${rule.label} is required.`;
        } else if (rule.pattern && !rule.pattern.test(value)) {
            errors[field] = rule.message;
        }
    }

    return { student, errors };
}

// ---------------------------------------------------------------------------
// Student REST API
// ---------------------------------------------------------------------------

// GET /api/students?q=term  -> list students; optional case-insensitive
// search on name (partial match) or student ID (exact match).
app.get('/api/students', async (req, res, next) => {
    try {
        const q = String(req.query.q ?? '').trim().toLowerCase();
        const students = await loadStudents();
        const result = q
            ? students.filter((s) => s.name.toLowerCase().includes(q) || String(s.id) === q)
            : students;
        result.sort((a, b) => a.name.localeCompare(b.name));
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /api/students/:id -> one student
app.get('/api/students/:id', async (req, res, next) => {
    try {
        const students = await loadStudents();
        const student = students.find((s) => String(s.id) === req.params.id);
        if (!student) {
            return res.status(404).json({ error: `Student with ID ${req.params.id} not found.` });
        }
        res.json(student);
    } catch (error) {
        next(error);
    }
});

// POST /api/students -> create a student
app.post('/api/students', async (req, res, next) => {
    try {
        const { student, errors } = validateStudent(req.body);
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: errors });
        }

        const students = await loadStudents();
        if (students.some((s) => String(s.id) === student.id)) {
            return res.status(409).json({
                error: `A student with ID ${student.id} already exists.`,
                fields: { id: 'This student ID is already in use.' },
            });
        }

        students.push(student);
        await saveStudents(students);
        res.status(201).json({ message: `Student ${student.name} added successfully.`, student });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/students/:id -> delete a student
app.delete('/api/students/:id', async (req, res, next) => {
    try {
        const students = await loadStudents();
        const index = students.findIndex((s) => String(s.id) === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: `Student with ID ${req.params.id} not found.` });
        }

        const [deleted] = students.splice(index, 1);
        await saveStudents(students);
        res.json({ message: `Student ${deleted.name} deleted successfully.`, student: deleted });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
});

// Malformed JSON bodies and unexpected errors.
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error.' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
