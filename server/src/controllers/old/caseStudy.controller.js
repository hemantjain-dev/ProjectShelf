const { CaseStudyModel, ProjectModel} = require('../models');

// @desc    Create new case study
// @route   POST /api/case-studies
// @access  Private
exports.createCaseStudyModel = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.user = req.user.id;

        // Check if ProjectModel exists and belongs to user
        const ProjectModel = await ProjectModel.findById(req.body.ProjectModel);

        if (!ProjectModel) {
            return res.status(404).json({
                success: false,
                message: `ProjectModel not found with id of ${req.body.ProjectModel}`
            });
        }

        // Make sure user is ProjectModel owner
        if (ProjectModel.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to create a case study for this ProjectModel`
            });
        }

        const CaseStudyModel = await CaseStudyModel.create(req.body);

        res.status(201).json({
            success: true,
            data: CaseStudyModel
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all case studies
// @route   GET /api/case-studies
// @access  Public
exports.getCaseStudies = async (req, res, next) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];

        // Loop over removeFields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);

        // Create query string
        let queryStr = JSON.stringify(reqQuery);

        // Create operators ($gt, $gte, etc)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Finding resource
        query = CaseStudyModel.find(JSON.parse(queryStr)).populate([
            {
                path: 'user',
                select: 'name email'
            },
            {
                path: 'ProjectModel',
                select: 'title description'
            }
        ]);

        // Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await CaseStudyModel.countDocuments(JSON.parse(queryStr));

        query = query.skip(startIndex).limit(limit);

        // Executing query
        const caseStudies = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: caseStudies.length,
            pagination,
            data: caseStudies
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single case study
// @route   GET /api/case-studies/:id
// @access  Public
exports.getCaseStudyModel = async (req, res, next) => {
    try {
        const CaseStudyModel = await CaseStudyModel.findById(req.params.id).populate([
            {
                path: 'user',
                select: 'name email'
            },
            {
                path: 'ProjectModel',
                select: 'title description'
            }
        ]);

        if (!CaseStudyModel) {
            return res.status(404).json({
                success: false,
                message: `Case study not found with id of ${req.params.id}`
            });
        }

        res.status(200).json({
            success: true,
            data: CaseStudyModel
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update case study
// @route   PUT /api/case-studies/:id
// @access  Private
exports.updateCaseStudyModel = async (req, res, next) => {
    try {
        let CaseStudyModel = await CaseStudyModel.findById(req.params.id);

        if (!CaseStudyModel) {
            return res.status(404).json({
                success: false,
                message: `Case study not found with id of ${req.params.id}`
            });
        }

        // Make sure user is case study owner
        if (CaseStudyModel.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this case study`
            });
        }

        CaseStudyModel = await CaseStudyModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: CaseStudyModel
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete case study
// @route   DELETE /api/case-studies/:id
// @access  Private
exports.deleteCaseStudyModel = async (req, res, next) => {
    try {
        const CaseStudyModel = await CaseStudyModel.findById(req.params.id);

        if (!CaseStudyModel) {
            return res.status(404).json({
                success: false,
                message: `Case study not found with id of ${req.params.id}`
            });
        }

        // Make sure user is case study owner
        if (CaseStudyModel.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this case study`
            });
        }

        await CaseStudyModel.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};