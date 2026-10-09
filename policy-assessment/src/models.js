const mongoose = require('mongoose');
const { Schema } = mongoose;
const base = { timestamps: true, versionKey: false };

const Agent = mongoose.model('Agent', new Schema({
  agentName: { type: String, required: true, index: true }
}, base), 'agents');

const User = mongoose.model('User', new Schema({
  firstName: { type: String, required: true, index: true },
  dob: Date,
  address: String,
  phoneNumber: { type: String, index: true },
  state: String,
  zipCode: { type: String, index: true },
  email: { type: String, index: true },
  gender: String,
  userType: { type: String, index: true },
  city: String,
  applicantId: String,
  primary: String
}, base), 'users');

const UserAccount = mongoose.model('UserAccount', new Schema({
  accountName: { type: String, required: true, index: true },
  accountType: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true }
}, base), 'user_accounts');

const LOB = mongoose.model('LOB', new Schema({
  categoryName: { type: String, required: true, index: true }
}, base), 'lob');

const Carrier = mongoose.model('Carrier', new Schema({
  companyName: { type: String, required: true, index: true }
}, base), 'carriers');

const Policy = mongoose.model('Policy', new Schema({
  policyNumber: { type: String, required: true, unique: true, index: true },
  policyStartDate: Date,
  policyEndDate: Date,
  policyCategoryId: { type: Schema.Types.ObjectId, ref: 'LOB', index: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Carrier', index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', index: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'UserAccount', index: true },
  policyMode: String,
  producer: String,
  premiumAmountWritten: Number,
  premiumAmount: Number,
  policyType: String,
  csr: String,
  agencyId: String,
  hasActiveClientPolicy: String
}, base), 'policies');

const ScheduledMessage = mongoose.model('ScheduledMessage', new Schema({
  message: { type: String, required: true },
  scheduledAt: { type: Date, required: true, index: true },
  status: { type: String, enum: ['scheduled', 'processed'], default: 'scheduled', index: true },
  processedAt: Date
}, base), 'scheduled_messages');

module.exports = { Agent, User, UserAccount, LOB, Carrier, Policy, ScheduledMessage };
