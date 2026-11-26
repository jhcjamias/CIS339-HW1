const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const { HttpError } = require('../utils/errors');

const router = express.Router();

const toApi = (e) => ({
    studentId: e.student.studentId,
    courseId: e.course.courseId,
    enrolledAt: e.enrolledAt,
});

// GET /api/enrollments?courseId=&studentId= -> enrollments, optionally filtered
router.get('/', async (req, res) => {
    const filter = {};

    if (req.query.courseId) {
        const course = await Course.findOne({ courseId: Course.normalizeCourseId(req.query.courseId) });
        if (!course) return res.json([]);
        filter.course = course._id;
    }
    if (req.query.studentId) {
        const student = await Student.findOne({ studentId: String(req.query.studentId).trim() });
        if (!student) return res.json([]);
        filter.student = student._id;
    }

    const enrollments = await Enrollment.find(filter).sort({ enrolledAt: 1 }).populate('student').populate('course');
    res.json(enrollments.filter((e) => e.student && e.course).map(toApi));
});

// POST /api/enrollments { studentId, courseId } -> enroll a student in a course
router.post('/', async (req, res) => {
    const studentId = String(req.body?.studentId ?? '').trim();
    const courseId = Course.normalizeCourseId(req.body?.courseId);

    const fields = {};
    if (!studentId) fields.studentId = 'Select a student.';
    if (!courseId) fields.courseId = 'Select a course.';
    if (Object.keys(fields).length > 0) {
        throw new HttpError(400, 'Please select both a student and a course.', fields);
    }

    // An enrollment may reference only an existing student and course.
    const [student, course] = await Promise.all([
        Student.findOne({ studentId }),
        Course.findOne({ courseId }),
    ]);
    if (!student) {
        throw new HttpError(404, `Student with ID ${studentId} does not exist.`, {
            studentId: 'This student no longer exists.',
        });
    }
    if (!course) {
        throw new HttpError(404, `Course ${courseId} does not exist.`, {
            courseId: 'This course no longer exists.',
        });
    }

    const duplicateError = () =>
        new HttpError(409, `${student.name} is already enrolled in ${course.courseId}.`, {
            studentId: 'This student is already enrolled in the selected course.',
        });

    if (await Enrollment.exists({ student: student._id, course: course._id })) {
        throw duplicateError();
    }

    const goneError = () =>
        new HttpError(404, 'The selected student or course was deleted. Refresh and try again.');

    let enrollment;
    try {
        // Schema validators re-check that both references still exist.
        enrollment = await Enrollment.create({ student: student._id, course: course._id });
    } catch (error) {
        if (error.code === 11000) throw duplicateError(); // concurrent duplicate request
        if (error instanceof mongoose.Error.ValidationError) throw goneError();
        throw error;
    }

    // If the student or course was deleted while this request was in flight,
    // the cascade may already have run; undo so no orphan is left behind.
    const [studentStillExists, courseStillExists] = await Promise.all([
        Student.exists({ _id: student._id }),
        Course.exists({ _id: course._id }),
    ]);
    if (!studentStillExists || !courseStillExists) {
        await Enrollment.deleteOne({ _id: enrollment._id });
        throw goneError();
    }

    res.status(201).json({
        message: `${student.name} enrolled in ${course.courseId} successfully.`,
        enrollment: { studentId: student.studentId, courseId: course.courseId, enrolledAt: enrollment.enrolledAt },
    });
});

module.exports = router;
