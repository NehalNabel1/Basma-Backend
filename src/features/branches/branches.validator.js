import { body } from "express-validator";

export const branchValidator = [
  body("name").trim().notEmpty().withMessage("Branch name is required"),
];

export default { branchValidator };
