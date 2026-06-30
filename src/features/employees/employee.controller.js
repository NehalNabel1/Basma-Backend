import * as employeeService from "./employee.service.js";
import * as employeeRepo from "./employee.repository.js";
import { success, created } from "../../utils/response.js";
import { saveDocument, processProfileImage } from "../../utils/upload.js";

export const addEmployee = async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    national_id,
    birth_date,
    job_title,
    department,
    branch,
    direct_manager,
    employment_type,
    hire_date,
  } = req.body;

  // Process uploaded documents
  const documents = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const saved = await saveDocument(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      documents.push(saved);
    }
  }

  const companyName = await employeeRepo.getCompanyName(req.user.company_id);

  const employee = await employeeService.addEmployee({
    name,
    email,
    phone,
    address,
    national_id,
    birth_date,
    job_title,
    department,
    branch,
    direct_manager,
    employment_type,
    hire_date,
    documents,
    companyId: req.user.company_id,
    addedById: req.user.id,
    companyName,
    adderName: req.user.name,
  });

  return created(
    res,
    { id: employee.id, email: employee.email, name: employee.name },
    "Employee added and invite sent",
  );
};

export const getEmployees = async (req, res) => {
  const { page, limit, search, department, branch } = req.query;
  const result = await employeeService.getEmployees(req.user.company_id, {
    page,
    limit,
    search,
    department,
    branch,
  });
  return success(res, result);
};

export const getEmployee = async (req, res) => {
  const employee = await employeeService.getEmployee(
    req.params.id,
    req.user.company_id,
  );
  return success(res, employee);
};

export const updateEmployee = async (req, res) => {
  const updates = { ...req.body };

  // Handle profile image upload
  if (req.file) {
    updates.profile_image_url = await processProfileImage(req.file.buffer);
  }

  // Handle new documents
  const documents = [];
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const saved = await saveDocument(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      documents.push(saved);
    }
  }

  await employeeService.updateEmployee(
    req.params.id,
    req.user.company_id,
    updates,
    documents,
  );
  return success(res, {}, "Employee updated");
};

export const deleteDocument = async (req, res) => {
  await employeeService.deleteDocument(req.params.docId, req.user.company_id);
  return success(res, {}, "Document deleted");
};

export const toggleStatus = async (req, res) => {
  const { is_active } = req.body;
  await employeeService.toggleEmployeeStatus(
    req.params.id,
    req.user.company_id,
    is_active,
  );
  return success(
    res,
    {},
    `Employee ${is_active ? "activated" : "deactivated"}`,
  );
};

export const resendInvite = async (req, res) => {
  const companyName = await employeeRepo.getCompanyName(req.user.company_id);
  await employeeService.resendEmployeeInvite({
    employeeId: req.params.id,
    companyId: req.user.company_id,
    inviterName: req.user.name,
    companyName,
  });
  return success(res, {}, "Invite resent");
};
