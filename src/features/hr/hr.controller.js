import * as hrService from './hr.service.js';
import * as hrRepo from './hr.repository.js';
import { success, created } from '../../utils/response.js';

export const addHR = async (req, res) => {
  const { email, branch } = req.body;
  const { company_id } = req.user;

  const companyName = await hrRepo.getCompanyName(company_id);

  const hr = await hrService.addHR({
    email,
    branch,
    companyId: company_id,
    invitedById: req.user.id,
    companyName: companyName || 'Company',
    inviterName: req.user.name,
  });

  return created(res, { id: hr.id, email: hr.email }, 'HR invite sent successfully.');
};

export const getHRs = async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await hrService.getCompanyHRs(req.user.company_id, { page, limit, search });
  return success(res, result);
};

export const resendInvite = async (req, res) => {
  const companyName = await hrRepo.getCompanyName(req.user.company_id);
  await hrService.resendHRInvite({
    hrId: req.params.id,
    companyId: req.user.company_id,
    inviterName: req.user.name,
    companyName: companyName,
  });
  return success(res, {}, 'Invite resent');
};

export const deleteHR = async (req, res) => {
  await hrService.deleteHR(req.params.id, req.user.company_id);
  return success(res, {}, 'HR removed');
};
