const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const STUDENTS_FILE = path.join(__dirname, 'students.json');
const COURSES_FILE = path.join(__dirname, 'courses.json');
const ENROLLMENTS_FILE = path.join(__dirname, 'enrollments.json');

// ---------------------------------------------------------------------------
// Storage helpers (JSON files; replaced by MongoDB in a later requirement)
// ---------------------------------------------------------------------------

async function loadCollection(file) {
    try {
        const data = await fs.promises.readFile(file, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function saveCollection(file, items) {
    await fs.promises.writeFile(file, JSON.stringify(items, null, 2), 'utf8');
}

const loadStudents = () => loadCollection(STUDENTS_FILE);
const saveStudents = (students) => saveCollection(STUDENTS_FILE, students);
const loadCourses = () => loadCollection(COURSES_FILE);
const saveCourses = (courses) => saveCollection(COURSES_FILE, courses);
const loadEnrollments = () => loadCollection(ENROLLMENTS_FILE);
const saveEnrollments = (enrollments) => saveCollection(ENROLLMENTS_FILE, enrollments);

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
// Course REST API
// ---------------------------------------------------------------------------

// Course IDs are stored as entered (trimmed, single spaces), but compared
// case-insensitively so "cis 3339" and "CIS 3339" count as the same course.
const normalizeCourseId = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
const courseKey = (value) => normalizeCourseId(value).toUpperCase();

function validateCourse(body = {}) {
    const course = {
        courseId: normalizeCourseId(body.courseId).toUpperCase(),
        courseName: String(body.courseName ?? '').trim().replace(/\s+/g, ' '),
    };
    const errors = {};

    if (!course.courseId) {
        errors.courseId = 'Course ID is required.';
    } else if (!/^[A-Z0-9][A-Z0-9 -]{1,19}$/.test(course.courseId)) {
        errors.courseId = 'Course ID may contain letters, numbers, spaces, and hyphens (e.g. CIS 3339).';
    }

    if (!course.courseName) {
        errors.courseName = 'Course name is required.';
    } else if (course.courseName.length > 100) {
        errors.courseName = 'Course name must be 100 characters or fewer.';
    }

    return { course, errors };
}

// GET /api/courses -> list all courses, sorted by course ID
app.get('/api/courses', async (req, res, next) => {
    try {
        const courses = await loadCourses();
        courses.sort((a, b) => a.courseId.localeCompare(b.courseId, undefined, { numeric: true }));
        res.json(courses);
    } catch (error) {
        next(error);
    }
});

// GET /api/courses/:courseId -> one course
app.get('/api/courses/:courseId', async (req, res, next) => {
    try {
        const key = courseKey(req.params.courseId);
        const courses = await loadCourses();
        const course = courses.find((c) => courseKey(c.courseId) === key);
        if (!course) {
            return res.status(404).json({ error: `Course ${req.params.courseId} not found.` });
        }
        res.json(course);
    } catch (error) {
        next(error);
    }
});

// POST /api/courses -> create a course
app.post('/api/courses', async (req, res, next) => {
    try {
        const { course, errors } = validateCourse(req.body);
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: errors });
        }

        const courses = await loadCourses();
        if (courses.some((c) => courseKey(c.courseId) === courseKey(course.courseId))) {
            return res.status(409).json({
                error: `A course with ID ${course.courseId} already exists.`,
                fields: { courseId: 'This course ID is already in use.' },
            });
        }

        courses.push(course);
        await saveCourses(courses);
        res.status(201).json({ message: `Course ${course.courseId} added successfully.`, course });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/courses/:courseId -> delete a course
app.delete('/api/courses/:courseId', async (req, res, next) => {
    try {
        const key = courseKey(req.params.courseId);
        const courses = await loadCourses();
        const index = courses.findIndex((c) => courseKey(c.courseId) === key);
        if (index === -1) {
            return res.status(404).json({ error: `Course ${req.params.courseId} not found.` });
        }

        const [deleted] = courses.splice(index, 1);
        await saveCourses(courses);
        res.json({ message: `Course ${deleted.courseId} deleted successfully.`, course: deleted });
    } catch (error) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// Enrollment REST API
// ---------------------------------------------------------------------------

// GET /api/enrollments?courseId=&studentId= -> enrollments, optionally filtered
app.get('/api/enrollments', async (req, res, next) => {
    try {
        const courseFilter = req.query.courseId ? courseKey(req.query.courseId) : null;
        const studentFilter = req.query.studentId ? String(req.query.studentId).trim() : null;
        const enrollments = (await loadEnrollments()).filter(
            (e) =>
                (!courseFilter || courseKey(e.courseId) === courseFilter) &&
                (!studentFilter || e.studentId === studentFilter),
        );
        res.json(enrollments);
    } catch (error) {
        next(error);
    }
});

// POST /api/enrollments { studentId, courseId } -> enroll a student in a course
app.post('/api/enrollments', async (req, res, next) => {
    try {
        const studentId = String(req.body?.studentId ?? '').trim();
        const requestedCourseId = normalizeCourseId(req.body?.courseId);

        const errors = {};
        if (!studentId) errors.studentId = 'Select a student.';
        if (!requestedCourseId) errors.courseId = 'Select a course.';
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ error: 'Please select both a student and a course.', fields: errors });
        }

        const [students, courses, enrollments] = await Promise.all([
            loadStudents(),
            loadCourses(),
            loadEnrollments(),
        ]);

        // An enrollment may reference only an existing student and course.
        const student = students.find((s) => String(s.id) === studentId);
        if (!student) {
            return res.status(404).json({
                error: `Student with ID ${studentId} does not exist.`,
                fields: { studentId: 'This student no longer exists.' },
            });
        }
        const course = courses.find((c) => courseKey(c.courseId) === courseKey(requestedCourseId));
        if (!course) {
            return res.status(404).json({
                error: `Course ${requestedCourseId} does not exist.`,
                fields: { courseId: 'This course no longer exists.' },
            });
        }

        if (enrollments.some((e) => e.studentId === student.id && courseKey(e.courseId) === courseKey(course.courseId))) {
            return res.status(409).json({
                error: `${student.name} is already enrolled in ${course.courseId}.`,
                fields: { studentId: 'This student is already enrolled in the selected course.' },
            });
        }

        const enrollment = {
            studentId: student.id,
            courseId: course.courseId,
            enrolledAt: new Date().toISOString(),
        };
        enrollments.push(enrollment);
        await saveEnrollments(enrollments);

        res.status(201).json({
            message: `${student.name} enrolled in ${course.courseId} successfully.`,
            enrollment,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/courses/:courseId/students -> the course and its enrolled students
app.get('/api/courses/:courseId/students', async (req, res, next) => {
    try {
        const key = courseKey(req.params.courseId);
        const [students, courses, enrollments] = await Promise.all([
            loadStudents(),
            loadCourses(),
            loadEnrollments(),
        ]);

        const course = courses.find((c) => courseKey(c.courseId) === key);
        if (!course) {
            return res.status(404).json({ error: `Course ${req.params.courseId} not found.` });
        }

        const studentsById = new Map(students.map((s) => [String(s.id), s]));
        const roster = enrollments
            .filter((e) => courseKey(e.courseId) === key)
            .map((e) => {
                const student = studentsById.get(e.studentId);
                return student ? { ...student, enrolledAt: e.enrolledAt } : null;
            })
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));

        res.json({ course, students: roster });
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
