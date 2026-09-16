const asyncHandler = require("express-async-handler");
const { getAllStudents, addNewStudent, getStudentDetail, setStudentStatus, updateStudent } = require("./students-service");

/**
 * @module StudentsController
 * @description Express route handlers for student management (Problem 2: Backend Challenge).
 * Each handler delegates business logic to `students-service.js` and only deals
 * with HTTP concerns (parsing req, shaping res). All handlers are wrapped in
 * `express-async-handler` so thrown {@link ApiError}s reach the global error
 * middleware (`handleGlobalError`).
 */

/**
 * List students with optional filters.
 * @route GET /api/v1/students?name=&class=&section=&roll=
 * @param {import("express").Request} req - Query may contain `name`, `class`, `section`, `roll`.
 * @param {import("express").Response} res - Responds with `{ students: [...] }`.
 */
const handleGetAllStudents = asyncHandler(async (req, res) => {
    // NOTE: frontend sends `class`; repository expects `className`.
    const { name, class: className, section, roll } = req.query;
    const students = await getAllStudents({ name, className, section, roll });
    res.json({ students });
});

/**
 * Create a new student (DB function `student_add_update` with add-branch,
 * then fire-and-forget verification email).
 * @route POST /api/v1/students
 * @param {import("express").Request} req - Body is the flat `StudentProps` object from the frontend form.
 * @param {import("express").Response} res - 201 with `{ message, id }`.
 */
const handleAddStudent = asyncHandler(async (req, res) => {
    const payload = req.body;
    const message = await addNewStudent(payload);
    res.status(201).json(message);
});

/**
 * Update an existing student (DB function `student_add_update` update-branch).
 * @route PUT /api/v1/students/:id
 * @param {import("express").Request} req - `params.id` is the student user id; body is `StudentProps`.
 * @param {import("express").Response} res - Responds with `{ message }`.
 */
const handleUpdateStudent = asyncHandler(async (req, res) => {
    const { id: userId } = req.params;
    const payload = req.body;
    // DB function reads `userId` (not `id`) from the JSONB payload.
    const message = await updateStudent({ ...payload, userId: Number(userId) });
    res.json(message);
});

/**
 * Get one student's full detail (flat object incl. `reporterName`).
 * @route GET /api/v1/students/:id
 * @param {import("express").Request} req - `params.id` is the student user id.
 * @param {import("express").Response} res - Responds with the flat student detail object.
 */
const handleGetStudentDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const student = await getStudentDetail(Number(id));
    res.json(student);
});

/**
 * Enable/disable a student's system access.
 * @route POST /api/v1/students/:id/status
 * @param {import("express").Request} req - `params.id` is the student; `body.status` is boolean; reviewer comes from the JWT (`req.user.id`).
 * @param {import("express").Response} res - Responds with `{ message }`.
 */
const handleStudentStatus = asyncHandler(async (req, res) => {
    const { id: userId } = req.params;
    const { id: reviewerId } = req.user;
    const { status } = req.body;
    const message = await setStudentStatus({ userId: Number(userId), reviewerId, status });
    res.json(message);
});

module.exports = {
    handleGetAllStudents,
    handleGetStudentDetail,
    handleAddStudent,
    handleStudentStatus,
    handleUpdateStudent,
};
