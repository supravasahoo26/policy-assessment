const express = require('express');
const { User, Policy } = require('../models');
const router = express.Router();

// GET /api/policies/search?username=John
router.get('/search', async (req, res, next) => {
  try {
    const username = String(req.query.username || '').trim();
    if (!username) return res.status(400).json({ message: 'username is required' });

    const users = await User.find({
      $or: [
        { firstName: { $regex: username, $options: 'i' } },
        { email: { $regex: username, $options: 'i' } }
      ]
    }).lean();

    const policies = await Policy.find({ userId: { $in: users.map(u => u._id) } })
      .populate('userId', 'firstName dob address phoneNumber state zipCode email gender userType')
      .populate('agentId', 'agentName')
      .populate('accountId', 'accountName')
      .populate('policyCategoryId', 'categoryName')
      .populate('companyId', 'companyName')
      .lean();

    res.json({ count: policies.length, data: policies });
  } catch (error) { next(error); }
});

// GET /api/policies/aggregated-by-user
router.get('/aggregated-by-user', async (req, res, next) => {
  try {
    const data = await Policy.aggregate([
      { $group: { _id: '$userId', policyCount: { $sum: 1 }, policies: { $push: '$$ROOT' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: {
        _id: 0,
        userId: '$_id',
        userName: '$user.firstName',
        email: '$user.email',
        policyCount: 1,
        policies: 1
      } },
      { $sort: { userName: 1 } }
    ]);
    res.json({ count: data.length, data });
  } catch (error) { next(error); }
});

module.exports = router;
