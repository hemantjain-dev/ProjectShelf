// const AnalyticsModel = require('../models/AnalyticsModelModel');
// const ProjectModel = require('../models/ProjectModelModel');
// const CaseStudyModel = require('../models/CaseStudyModelModel');
const {AnalyticsModelModel,ProjectModelModel,CaseStudyModelModel} = require('../models');

// @desc    Record a page view
// @route   POST /api/AnalyticsModel/view
// @access  Public
exports.recordView = async (req, res, next) => {
    try {
        const { refType, refId, visitorId } = req.body;

        // Validate reference type
        if (!['ProjectModel', 'CaseStudyModel'].includes(refType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reference type'
            });
        }

        // Find the referenced document to get the owner
        let refDoc;
        if (refType === 'ProjectModel') {
            refDoc = await ProjectModel.findById(refId);
        } else {
            refDoc = await CaseStudyModel.findById(refId);
        }

        if (!refDoc) {
            return res.status(404).json({
                success: false,
                message: `${refType} not found with id of ${refId}`
            });
        }

        // Find or create AnalyticsModel document
        let AnalyticsModel = await AnalyticsModel.findOne({ refType, refId });

        if (!AnalyticsModel) {
            AnalyticsModel = await AnalyticsModel.create({
                refType,
                refId,
                owner: refDoc.user,
                views: 1,
                uniqueVisitors: [{
                    visitorId,
                    firstVisit: new Date(),
                    lastVisit: new Date(),
                    visitCount: 1
                }],
                dailyViews: [{
                    date: new Date().setHours(0, 0, 0, 0),
                    count: 1
                }]
            });
        } else {
            // Increment views
            AnalyticsModel.views += 1;

            // Update or add visitor
            const visitorIndex = AnalyticsModel.uniqueVisitors.findIndex(
                visitor => visitor.visitorId === visitorId
            );

            if (visitorIndex > -1) {
                AnalyticsModel.uniqueVisitors[visitorIndex].lastVisit = new Date();
                AnalyticsModel.uniqueVisitors[visitorIndex].visitCount += 1;
            } else {
                AnalyticsModel.uniqueVisitors.push({
                    visitorId,
                    firstVisit: new Date(),
                    lastVisit: new Date(),
                    visitCount: 1
                });
            }

            // Update daily views
            const today = new Date().setHours(0, 0, 0, 0);
            const dailyViewIndex = AnalyticsModel.dailyViews.findIndex(
                view => new Date(view.date).setHours(0, 0, 0, 0) === today
            );

            if (dailyViewIndex > -1) {
                AnalyticsModel.dailyViews[dailyViewIndex].count += 1;
            } else {
                AnalyticsModel.dailyViews.push({
                    date: today,
                    count: 1
                });
            }

            await AnalyticsModel.save();
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Record a click-through
// @route   POST /api/AnalyticsModel/click
// @access  Public
exports.recordClick = async (req, res, next) => {
    try {
        const { refType, refId, linkType, url } = req.body;

        // Find AnalyticsModel document
        let AnalyticsModel = await AnalyticsModel.findOne({ refType, refId });

        if (!AnalyticsModel) {
            return res.status(404).json({
                success: false,
                message: 'AnalyticsModel record not found'
            });
        }

        // Update click-throughs
        const clickIndex = AnalyticsModel.clickThroughs.findIndex(
            click => click.linkType === linkType && click.url === url
        );

        if (clickIndex > -1) {
            AnalyticsModel.clickThroughs[clickIndex].count += 1;
        } else {
            AnalyticsModel.clickThroughs.push({
                linkType,
                count: 1,
                url
            });
        }

        await AnalyticsModel.save();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Record engagement metrics
// @route   POST /api/AnalyticsModel/engagement
// @access  Public
exports.recordEngagement = async (req, res, next) => {
    try {
        const { refType, refId, timeOnPage, scrollDepth, bounced } = req.body;

        // Find AnalyticsModel document
        let AnalyticsModel = await AnalyticsModel.findOne({ refType, refId });

        if (!AnalyticsModel) {
            return res.status(404).json({
                success: false,
                message: 'AnalyticsModel record not found'
            });
        }

        // Update engagement metrics
        if (!AnalyticsModel.engagementMetrics) {
            AnalyticsModel.engagementMetrics = {
                avgTimeOnPage: timeOnPage,
                scrollDepth: scrollDepth,
                bounceRate: bounced ? 100 : 0
            };
        } else {
            // Calculate new average time on page
            const currentAvg = AnalyticsModel.engagementMetrics.avgTimeOnPage || 0;
            const totalViews = AnalyticsModel.views;
            const newAvg = ((currentAvg * (totalViews - 1)) + timeOnPage) / totalViews;

            // Calculate new scroll depth average
            const currentScrollAvg = AnalyticsModel.engagementMetrics.scrollDepth || 0;
            const newScrollAvg = ((currentScrollAvg * (totalViews - 1)) + scrollDepth) / totalViews;

            // Update bounce rate
            const currentBounces = (AnalyticsModel.engagementMetrics.bounceRate || 0) * (totalViews - 1) / 100;
            const newBounces = bounced ? currentBounces + 1 : currentBounces;
            const newBounceRate = (newBounces / totalViews) * 100;

            AnalyticsModel.engagementMetrics = {
                avgTimeOnPage: newAvg,
                scrollDepth: newScrollAvg,
                bounceRate: newBounceRate
            };
        }

        await AnalyticsModel.save();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get AnalyticsModel for a user's content
// @route   GET /api/AnalyticsModel/user
// @access  Private
exports.getUserAnalyticsModel = async (req, res, next) => {
    try {
        const AnalyticsModel = await AnalyticsModel.find({ owner: req.user.id })
            .populate([
                {
                    path: 'refId',
                    select: 'title'
                }
            ]);

        // Aggregate data for dashboard
        const totalViews = AnalyticsModel.reduce((sum, item) => sum + item.views, 0);
        const totalUniqueVisitors = new Set(
            AnalyticsModel.flatMap(item => item.uniqueVisitors.map(v => v.visitorId))
        ).size;

        const totalClicks = AnalyticsModel.reduce(
            (sum, item) => sum + item.clickThroughs.reduce((s, c) => s + c.count, 0),
            0
        );

        // Get top performing content
        const topContent = [...AnalyticsModel].sort((a, b) => b.views - a.views).slice(0, 5);

        // Get daily views for chart
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const dailyViewsData = AnalyticsModel.flatMap(item =>
            item.dailyViews.filter(dv => new Date(dv.date) >= last30Days)
        ).reduce((acc, curr) => {
            const dateStr = new Date(curr.date).toISOString().split('T')[0];
            acc[dateStr] = (acc[dateStr] || 0) + curr.count;
            return acc;
        }, {});

        const chartData = Object.entries(dailyViewsData).map(([date, count]) => ({
            date,
            count
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({
            success: true,
            data: {
                totalViews,
                totalUniqueVisitors,
                totalClicks,
                topContent: topContent.map(item => ({
                    id: item._id,
                    refType: item.refType,
                    refId: item.refId,
                    title: item.refId.title,
                    views: item.views,
                    uniqueVisitors: item.uniqueVisitors.length,
                    clickThroughs: item.clickThroughs.reduce((sum, click) => sum + click.count, 0)
                })),
                chartData
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get detailed AnalyticsModel for a specific content
// @route   GET /api/AnalyticsModel/:refType/:refId
// @access  Private
exports.getContentAnalyticsModel = async (req, res, next) => {
    try {
        const { refType, refId } = req.params;

        // Find the referenced document to verify ownership
        let refDoc;
        if (refType === 'ProjectModel') {
            refDoc = await ProjectModel.findById(refId);
        } else if (refType === 'CaseStudyModel') {
            refDoc = await CaseStudyModel.findById(refId);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid reference type'
            });
        }

        if (!refDoc) {
            return res.status(404).json({
                success: false,
                message: `${refType} not found with id of ${refId}`
            });
        }

        // Check ownership
        if (refDoc.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access these AnalyticsModel'
            });
        }

        const AnalyticsModel = await AnalyticsModel.findOne({ refType, refId });

        if (!AnalyticsModel) {
            return res.status(404).json({
                success: false,
                message: 'No AnalyticsModel data found for this content'
            });
        }

        res.status(200).json({
            success: true,
            data: AnalyticsModel
        });
    } catch (error) {
        next(error);
    }
};