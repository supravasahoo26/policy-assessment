const { parentPort, workerData } = require('worker_threads');
const XLSX = require('xlsx');

function normalize(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}
function numberOrNull(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const n = Number(String(value).replace(/[$,]/g, '').trim());
  return Number.isFinite(n) ? n : null;
}
function parseDate(value) {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0)).toISOString();
  }
  const raw = String(value).trim();
  // Parse YYYY-MM-DD as a UTC date to avoid locale-dependent ambiguity.
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))).toISOString();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
function normalizedKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
}
function get(row, aliases) {
  const map = new Map(Object.keys(row).map(key => [normalizedKey(key), row[key]]));
  for (const alias of aliases) {
    const key = normalizedKey(alias);
    if (map.has(key)) return map.get(key);
  }
  return '';
}
function optionalString(value) {
  const s = normalize(value);
  return s || null;
}

try {
  const workbook = XLSX.readFile(workerData.filePath, { cellDates: true });
  if (!workbook.SheetNames.length) throw new Error('The uploaded file has no worksheet');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const sourceRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });
  const rows = sourceRows.map((row, index) => ({
    rowNumber: index + 2,
    // Headers in the supplied sample: agent, firstname, phone, zip, dob, etc.
    agentName: normalize(get(row, ['agent', 'agent name', 'agentName'])),
    firstName: normalize(get(row, ['firstname', 'first name', 'firstName', 'username', 'user name'])),
    dob: parseDate(get(row, ['dob', 'date of birth'])),
    address: normalize(get(row, ['address'])),
    phoneNumber: normalize(get(row, ['phone', 'phone number', 'phoneNumber'])),
    state: normalize(get(row, ['state'])),
    zipCode: normalize(get(row, ['zip', 'zip code', 'zipcode', 'zipCode'])),
    email: normalize(get(row, ['email'])),
    gender: normalize(get(row, ['gender'])),
    userType: normalize(get(row, ['userType', 'user type'])),
    city: normalize(get(row, ['city'])),
    applicantId: normalize(get(row, ['Applicant ID', 'applicantId'])),
    primary: normalize(get(row, ['primary'])),
    accountName: normalize(get(row, ['account_name', 'account name', 'Account Name'])),
    accountType: normalize(get(row, ['account_type', 'account type'])),
    categoryName: normalize(get(row, ['category_name', 'category name', 'Policy Category', 'LOB'])),
    companyName: normalize(get(row, ['company_name', 'company name', 'Policy Carrier', 'Carrier'])),
    policyNumber: normalize(get(row, ['policy_number', 'policy number', 'Policy Number'])),
    policyStartDate: parseDate(get(row, ['policy_start_date', 'policy start date', 'Policy Start Date'])),
    policyEndDate: parseDate(get(row, ['policy_end_date', 'policy end date', 'Policy End Date'])),
    policyMode: normalize(get(row, ['policy_mode', 'policy mode'])),
    producer: normalize(get(row, ['producer'])),
    premiumAmountWritten: numberOrNull(get(row, ['premium_amount_written', 'premium amount written'])),
    premiumAmount: numberOrNull(get(row, ['premium_amount', 'premium amount'])),
    policyType: normalize(get(row, ['policy_type', 'policy type'])),
    csr: normalize(get(row, ['csr'])),
    agencyId: normalize(get(row, ['agency_id', 'agency id'])),
    hasActiveClientPolicy: normalize(get(row, ['hasActive ClientPolicy', 'has_active_client_policy', 'hasActiveClientPolicy']))
  }));
  parentPort.postMessage({ ok: true, rows });
} catch (error) {
  parentPort.postMessage({ ok: false, error: error.message });
}
