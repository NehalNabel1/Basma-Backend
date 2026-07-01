import express from "express";
import * as ctrl from "./employee.controller.js";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { uploadDocuments, uploadEmployeeFiles } from "../../utils/upload.js";
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
router.get("/department/:department", ctrl.getEmployeesByDepartment); // moved here
router.get("/:id", ctrl.getEmployee);

router.put(
  "/:id",
  uploadEmployeeFiles,
  updateEmployeeValidator,
  validate,
  authorize("manager", "hr"),
  ctrl.updateEmployee,
);
router.post("/:id/resend-invite", ctrl.resendInvite);
router.delete("/:id/documents/:docId", ctrl.deleteDocument);
router.patch("/:id/status", authorize("manager", "hr"), ctrl.toggleStatus);
router.delete("/:id", authorize("manager", "hr"), ctrl.deleteEmployee);
export default router;
