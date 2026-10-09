const path = require('path');
const { Worker } = require('worker_threads');
const { Agent, User, UserAccount, LOB, Carrier, Policy } = require('../models');

function runWorker(filePath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, '../workers/importWorker.js'), { workerData: { filePath } });
    let settled = false;
    worker.once('message', result => {
      settled = true;
      result.ok ? resolve(result.rows) : reject(new Error(result.error));
    });
    worker.once('error', error => { settled = true; reject(error); });
    worker.once('exit', code => {
      if (code !== 0 && !settled) reject(new Error(`Import worker stopped with exit code ${code}`));
    });
  });
}

async function upsertBy(model, filter, update) {
  return model.findOneAndUpdate(filter, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function importFile(filePath) {
  const rows = await runWorker(filePath);
  const result = { rowsRead: rows.length, imported: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    try {
      if (!row.firstName || !row.policyNumber) {
        result.skipped++;
        result.errors.push({ row: row.rowNumber, error: 'firstname and policy_number are required' });
        continue;
      }

      const agent = row.agentName ? await upsertBy(Agent, { agentName: row.agentName }, { agentName: row.agentName }) : null;
      const userFilter = row.email
        ? { email: row.email }
        : { firstName: row.firstName, phoneNumber: row.phoneNumber || null, dob: row.dob || null };
      const user = await upsertBy(User, userFilter, {
        firstName: row.firstName,
        ...(row.dob ? { dob: row.dob } : {}),
        address: row.address,
        phoneNumber: row.phoneNumber,
        state: row.state,
        zipCode: row.zipCode,
        email: row.email,
        gender: row.gender,
        userType: row.userType,
        city: row.city,
        applicantId: row.applicantId,
        primary: row.primary
      });

      const account = row.accountName ? await upsertBy(UserAccount,
        { accountName: row.accountName, userId: user._id },
        { accountName: row.accountName, accountType: row.accountType, userId: user._id }) : null;
      const lob = row.categoryName ? await upsertBy(LOB,
        { categoryName: row.categoryName }, { categoryName: row.categoryName }) : null;
      const carrier = row.companyName ? await upsertBy(Carrier,
        { companyName: row.companyName }, { companyName: row.companyName }) : null;

      await upsertBy(Policy, { policyNumber: row.policyNumber }, {
        policyNumber: row.policyNumber,
        ...(row.policyStartDate ? { policyStartDate: row.policyStartDate } : {}),
        ...(row.policyEndDate ? { policyEndDate: row.policyEndDate } : {}),
        ...(lob ? { policyCategoryId: lob._id } : {}),
        ...(carrier ? { companyId: carrier._id } : {}),
        userId: user._id,
        ...(agent ? { agentId: agent._id } : {}),
        ...(account ? { accountId: account._id } : {}),
        policyMode: row.policyMode,
        producer: row.producer,
        ...(row.premiumAmountWritten !== null ? { premiumAmountWritten: row.premiumAmountWritten } : {}),
        ...(row.premiumAmount !== null ? { premiumAmount: row.premiumAmount } : {}),
        policyType: row.policyType,
        csr: row.csr,
        agencyId: row.agencyId,
        hasActiveClientPolicy: row.hasActiveClientPolicy
      });
      result.imported++;
    } catch (error) {
      result.skipped++;
      result.errors.push({ row: row.rowNumber, error: error.message });
    }
  }
  return result;
}
module.exports = { importFile };
