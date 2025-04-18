const { CollaborationModel,ProjectModel,UserModel} = require('../models');
const { createNotification } = require('./notification.controller');

// @desc    Invite a collaborator
// @route   POST /api/CollaborationModels
// @access  Private
exports.inviteCollaborator = async (req, res, next) => {
    try {
        const { ProjectModelId, email, role } = req.body;

        // Check if ProjectModel exists and UserModel is owner
        const ProjectModel = await ProjectModel.findById(ProjectModelId);

        if (!ProjectModel) {
            return res.status(404).json({
                success: false,
                message: `ProjectModel not found with id of ${ProjectModelId}`
            });
        }

        if (ProjectModel.UserModel.toString() !== req.UserModel.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to invite collaborators to this ProjectModel'
            });
        }

        // Find UserModel by email
        const collaborator = await UserModel.findOne({ email });

        if (!collaborator) {
            return res.status(404).json({
                success: false,
                message: `UserModel not found with email ${email}`
            });
        }

        // Check if UserModel is already a collaborator
        const existingCollaborationModel = await CollaborationModel.findOne({
            ProjectModel: ProjectModelId,
            collaborator: collaborator._id
        });

        if (existingCollaborationModel) {
            return res.status(400).json({
                success: false,
                message: 'UserModel is already a collaborator on this ProjectModel'
            });
        }

        // Create CollaborationModel
        const CollaborationModel = await CollaborationModel.create({
            ProjectModel: ProjectModelId,
            owner: req.UserModel.id,
            collaborator: collaborator._id,
            role
        });

        // Send notification to collaborator
        await createNotification(
            collaborator._id,
            req.UserModel.id,
            'system',
            `You've been invited to collaborate on ProjectModel: ${ProjectModel.title}`,
            'ProjectModel',
            ProjectModel._id,
            `/ProjectModels/${ProjectModel._id}`
        );

        res.status(201).json({
            success: true,
            data: CollaborationModel
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Respond to CollaborationModel invitation
// @route   PUT /api/CollaborationModels/:id/respond
// @access  Private
exports.respondToInvitation = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either accepted or rejected'
            });
        }

        const CollaborationModel = await CollaborationModel.findById(req.params.id);

        if (!CollaborationModel) {
            return res.status(404).json({
                success: false,
                message: `CollaborationModel not found with id of ${req.params.id}`
            });
        }

        // Check if UserModel is the collaborator
        if (CollaborationModel.collaborator.toString() !== req.UserModel.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to respond to this invitation'
            });
        }

        CollaborationModel.status = status;
        await CollaborationModel.save();

        // Get ProjectModel details
        const ProjectModel = await ProjectModel.findById(CollaborationModel.ProjectModel);

        // Send notification to owner
        await createNotification(
            CollaborationModel.owner,
            req.UserModel.id,
            'system',
            `${req.UserModel.name} has ${status} your invitation to collaborate on: ${ProjectModel.title}`,
            'ProjectModel',
            ProjectModel._id,
            `/ProjectModels/${ProjectModel._id}`
        );

        res.status(200).json({
            success: true,
            data: CollaborationModel
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get ProjectModel collaborators
// @route   GET /api/CollaborationModels/ProjectModel/:ProjectModelId
// @access  Private
exports.getProjectModelCollaborators = async (req, res, next) => {
    try {
        const ProjectModel = await ProjectModel.findById(req.params.ProjectModelId);

        if (!ProjectModel) {
            return res.status(404).json({
                success: false,
                message: `ProjectModel not found with id of ${req.params.ProjectModelId}`
            });
        }

        // Check if UserModel is owner or collaborator
        const isOwner = ProjectModel.UserModel.toString() === req.UserModel.id;

        if (!isOwner) {
            const isCollaborator = await CollaborationModel.findOne({
                ProjectModel: req.params.ProjectModelId,
                collaborator: req.UserModel.id,
                status: 'accepted'
            });

            if (!isCollaborator) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized to view collaborators for this ProjectModel'
                });
            }
        }

        const CollaborationModels = await CollaborationModel.find({
            ProjectModel: req.params.ProjectModelId
        }).populate('collaborator', 'name email profileImage');

        res.status(200).json({
            success: true,
            count: CollaborationModels.length,
            data: CollaborationModels
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get UserModel's CollaborationModels
// @route   GET /api/CollaborationModels/UserModel
// @access  Private
exports.getUserModelCollaborationModels = async (req, res, next) => {
    try {
        const CollaborationModels = await CollaborationModel.find({
            collaborator: req.UserModel.id,
            status: 'accepted'
        })
            .populate({
                path: 'ProjectModel',
                select: 'title description'
            })
            .populate({
                path: 'owner',
                select: 'name email profileImage'
            });

        res.status(200).json({
            success: true,
            count: CollaborationModels.length,
            data: CollaborationModels
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove collaborator
// @route   DELETE /api/CollaborationModels/:id
// @access  Private
exports.removeCollaborator = async (req, res, next) => {
    try {
        const CollaborationModel = await CollaborationModel.findById(req.params.id);

        if (!CollaborationModel) {
            return res.status(404).json({
                success: false,
                message: `CollaborationModel not found with id of ${req.params.id}`
            });
        }

        // Check if UserModel is owner or the collaborator themselves
        const isOwner = CollaborationModel.owner.toString() === req.UserModel.id;
        const isSelfRemoval = CollaborationModel.collaborator.toString() === req.UserModel.id;

        if (!isOwner && !isSelfRemoval) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to remove this collaborator'
            });
        }

        await CollaborationModel.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};