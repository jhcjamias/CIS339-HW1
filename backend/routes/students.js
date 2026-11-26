const express = require('express');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const { HttpError, validateDocument } = require('../utils/errors');
const { enrollmentSummary } = require('../utils/text');

const router = express.Router();

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const byName = { name: 1 };
const caseInsensitive = { locale: 'en', strength: 2 };

// GET /api/students?q=term -> all students, or a case-insensitive partial
// name match / exact student ID match.
router.get('/', async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    const filter = q
        ? { $or: [{ name: { $regex: escapeRegex(q), $options: 'i' } }, { studentId: q }] }
        : {};
    const students = await Student.find(filter).sort(byName).collation(caseInsensitive);
    res.json(students);
});

// GET /api/students/:id -> one student
router.get('/:id', async (req, res) => {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) throw new HttpError(404, `Student with ID ${req.params.id} not found.`);
    res.json(student);
});

// POST /api/students -> create a student
router.post('/', async (req, res) => {
    const { name, id, phone, zip } = req.body ?? {};
    const student = new Student({ studentId: id, name, phone, zip });
    await validateDocument(student, { studentId: 'id' });

    if (await Student.exists({ studentId: student.studentId })) {
        throw new HttpError(409, `A student with ID ${student.studentId} already exists.`, {
            id: 'This student ID is already in use.',
        });
    }

    await student.save();
    res.status(201).json({ message: `Student ${student.name} added successfully.`, student });
});

// DELETE /api/students/:id -> delete a student and all of their enrollments.
// The student is removed first so no new enrollment can reference it while
// its existing enrollments are being cleaned up.
router.delete('/:id', async (req, res) => {
    const student = await Student.findOneAndDelete({ studentId: req.params.id });
    if (!student) throw new HttpError(404, `Student with ID ${req.params.id} not found.`);

    const { deletedCount } = await Enrollment.deleteMany({ student: student._id });
    res.json({
        message: `Student ${student.name} deleted successfully. ${enrollmentSummary(deletedCount)}`,
        student,
        enrollmentsRemoved: deletedCount,
    });
});

module.exports = router;
