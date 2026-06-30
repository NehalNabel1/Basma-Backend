import express from "express";
import * as ctrl from "./employee.controller.js";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { uploadDocuments, uploadProfileImage } from "../../utils/upload.js";
import {
  addEmployeeValidator,
  updateEmployeeValidator,
} from "./employee.validator.js";

const router = express.Router();

// All employee routes require manager or HR auth
router.use(protect, authorize("manager", "hr"));

router.post(
  "/",
  uploadDocuments,
  addEmployeeValidator,
  validate,
  ctrl.addEmployee,
);
router.get("/", ctrl.getEmployees);
router.get("/:id", ctrl.getEmployee);

// Handle updates (both multipart for profile images/new documents and JSON)
// Combining multer middlewares as employees can update profile_image and documents
const uploadMix = (req, res, next) => {
  uploadDocuments(req, res, (err) => {
    if (err) return next(err);
    uploadProfileImage(req, res, next);
  });
};

router.put(
  "/:id",
  uploadMix,
  updateEmployeeValidator,
  validate,
  ctrl.updateEmployee,
);
router.post("/:id/resend-invite", ctrl.resendInvite);
router.delete("/:id/documents/:docId", ctrl.deleteDocument);
router.patch("/:id/status", authorize("manager", "hr"), ctrl.toggleStatus);

export default router;
