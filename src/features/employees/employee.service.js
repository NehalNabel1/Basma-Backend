import * as employeeRepo from "./employee.repository.js";
import { sendEmployeeInviteEmail } from "../../utils/email.js";
import { deleteFile } from "../../utils/upload.js";
import logger from "../../utils/logger.js";

/**
 * Add a new employee — sends invite email directly (no OTP)
 */
export const addEmployee = async ({
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
  companyId,
  addedById,
  companyName,
  adderName,
}) => {
  
  const existing = await employeeRepo.findUserByEmail(email);
  if (existing) {
    throw Object.assign(new Error("Email already registered"), {
      statusCode: 409,
    });
  }

  const employee = await employeeRepo.createEmployeeInTransaction({
    companyId,
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
    addedById,
  });

  // Invite link — employee clicks it, sets password
  const inviteUrl = `${process.env.FRONTEND_URL}/auth/invite?token=${employee.invite_token}&email=${encodeURIComponent(email)}`;
  await sendEmployeeInviteEmail({
    to: email,
    name,
    inviteUrl,
    companyName,
    inviterName: adderName,
  });

  logger.info(`Employee added: ${email} by ${addedById}`);
  return employee;
};

/**
 * Get all employees for a company
 */
export const getEmployees = async (
  companyId,
  { page = 1, limit = 20, search, department, branch } = {},
) => {
  const offset = (page - 1) * limit;

  const result = await employeeRepo.getEmployeesList(companyId, {
    limit,
    offset,
    search,
    department,
    branch,
  });

  return {
    employees: result.employees,
    pagination: {
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(result.total / limit),
    },
  };
};

/**
 * Get single employee with documents
 */
export const getEmployee = async (employeeId, companyId) => {
  const employee = await employeeRepo.getEmployeeById(employeeId, companyId);
  if (!employee) {
    throw Object.assign(new Error("Employee not found"), { statusCode: 404 });
  }
  return employee;
};

/**
 * Update employee
 */
export const updateEmployee = async (
  employeeId,
  companyId,
  updates,
  documents = [],
) => {
  const employee = await employeeRepo.checkEmployeeExists(employeeId);
  if (!employee)
    throw Object.assign(new Error("Employee not found"), { statusCode: 404 });
  if (employee.company_id !== companyId)
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });

  const allowedFields = [
    "name",
    "phone",
    "address",
    "birth_date",
    "job_title",
    "department",
    "branch",
    "direct_manager",
    "employment_type",
    "hire_date",
    "profile_image_url",
  ];

  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      params.push(value);
      setClauses.push(`${key} = $${params.length}`);
    }
  }

  if (setClauses.length > 0) {
    params.push(employeeId);
    await employeeRepo.updateEmployeeFields(employeeId, setClauses, params);
  }

  for (const doc of documents) {
    await employeeRepo.insertEmployeeDocument({
      employeeId,
      filename: doc.filename,
      url: doc.url,
      size: doc.size,
      mimetype: doc.mimetype,
    });
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (docId, companyId) => {
  const doc = await employeeRepo.findDocumentById(docId);
  if (!doc)
    throw Object.assign(new Error("Document not found"), { statusCode: 404 });
  if (doc.company_id !== companyId)
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });

  await employeeRepo.deleteDocumentById(docId);
  deleteFile(doc.file_url);
};

/**
 * Toggle employee active status
 */
export const toggleEmployeeStatus = async (
  employeeId,
  companyId,
  is_active,
) => {
  const employee = await employeeRepo.checkEmployeeExists(employeeId);
  if (!employee)
    throw Object.assign(new Error("Employee not found"), { statusCode: 404 });
  if (employee.company_id !== companyId)
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });

  await employeeRepo.updateEmployeeStatus(employeeId, is_active);
};

export const resendEmployeeInvite = async ({
  employeeId,
  companyId,
  inviterName,
  companyName,
}) => {
  const employee = await employeeRepo.getEmployeeById(employeeId, companyId);
  if (!employee)
    throw Object.assign(new Error("Employee not found"), { statusCode: 404 });
  if (employee.company_id !== companyId)
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });
  if (employee.is_verified)
    throw Object.assign(
      new Error("Employee has already activated their account"),
      { statusCode: 409 },
    );

  const updatedEmployee = await employeeRepo.rotateInviteToken(employeeId);
  const inviteUrl = `${process.env.FRONTEND_URL}/auth/invite?token=${updatedEmployee.invite_token}&email=${encodeURIComponent(updatedEmployee.email)}`;
  await sendEmployeeInviteEmail({
    to: updatedEmployee.email,
    name: updatedEmployee.name || updatedEmployee.email,
    inviteUrl,
    companyName,
    inviterName,
  });

  await employeeRepo.updateInviteSentAt(employeeId);
  return { email: updatedEmployee.email };
};


export const deleteEmployee = async (employeeId, companyId) => {
  const employee = await employeeRepo.checkEmployeeExists(employeeId);
  if (!employee)
    throw Object.assign(new Error("Employee not found"), { statusCode: 404 });
  if (employee.company_id !== companyId)
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });

  await employeeRepo.deleteEmployeeById(employeeId);
};