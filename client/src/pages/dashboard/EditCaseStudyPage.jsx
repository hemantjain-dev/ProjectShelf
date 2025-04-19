import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const EditCaseStudyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: '',
        challenge: '',
        solution: '',
        outcome: '',
        published: false
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchCaseStudy();
        fetchProjects();
    }, [id]);

    const fetchCaseStudy = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/case-studies/${id}`);
            setFormData({
                title: response.data.title,
                description: response.data.description,
                projectId: response.data.projectId,
                challenge: response.data.challenge,
                solution: response.data.solution,
                outcome: response.data.outcome,
                published: response.data.published
            });
        } catch (error) {
            console.error('Error fetching case study:', error);
            setSaveMessage({
                type: 'error',
                text: 'Failed to load case study. It may have been deleted or you don\'t have permission to view it.'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/api/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        // Clear error when field is edited
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: ''
            });
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.title.trim()) errors.title = 'Title is required';
        if (!formData.projectId) errors.projectId = 'Project is required';
        if (!formData.description.trim()) errors.description = 'Description is required';
        if (!formData.challenge.trim()) errors.challenge = 'Challenge is required';
        if (!formData.solution.trim()) errors.solution = 'Solution is required';
        if (!formData.outcome.trim()) errors.outcome = 'Outcome is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setSaveMessage({ type: '', text: '' });

        try {
            await api.put(`/api/case-studies/${id}`, formData);
            setSaveMessage({
                type: 'success',
                text: 'Case study updated successfully!'
            });
            // Scroll to top to show the message
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('Error updating case study:', error);
            setSaveMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update case study. Please try again.'
            });
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this case study? This action cannot be undone.')) return;

        try {
            await api.delete(`/api/case-studies/${id}`);
            navigate('/dashboard/case-studies', {
                state: { message: 'Case study deleted successfully' }
            });
        } catch (error) {
            console.error('Error deleting case study:', error);
            setSaveMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to delete case study. Please try again.'
            });
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Edit Case Study</h1>
                <div className="flex gap-2">
                    <Link to="/dashboard/case-studies" className="btn btn-ghost">
                        Cancel
                    </Link>
                    <button
                        className="btn btn-error"
                        onClick={handleDelete}
                    >
                        Delete
                    </button>
                </div>
            </div>

            {saveMessage.text && (
                <div className={`alert ${saveMessage.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
                    <span>{saveMessage.text}</span>
                </div>
            )}

            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Title</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className={`input input-bordered ${formErrors.title ? 'input-error' : ''}`}
                                />
                                {formErrors.title && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">{formErrors.title}</span>
                                    </label>
                                )}
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Project</span>
                                </label>
                                <select
                                    name="projectId"
                                    value={formData.projectId}
                                    onChange={handleInputChange}
                                    className={`select select-bordered ${formErrors.projectId ? 'select-error' : ''}`}
                                >
                                    <option value="">Select a project</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.title}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.projectId && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">{formErrors.projectId}</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Description</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className={`textarea textarea-bordered h-24 ${formErrors.description ? 'textarea-error' : ''}`}
                                placeholder="Brief overview of the case study"
                            ></textarea>
                            {formErrors.description && (
                                <label className="label">
                                    <span className="label-text-alt text-error">{formErrors.description}</span>
                                </label>
                            )}
                        </div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Challenge</span>
                            </label>
                            <textarea
                                name="challenge"
                                value={formData.challenge}
                                onChange={handleInputChange}
                                className={`textarea textarea-bordered h-24 ${formErrors.challenge ? 'textarea-error' : ''}`}
                                placeholder="What problem were you trying to solve?"
                            ></textarea>
                            {formErrors.challenge && (
                                <label className="label">
                                    <span className="label-text-alt text-error">{formErrors.challenge}</span>
                                </label>
                            )}
                        </div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Solution</span>
                            </label>
                            <textarea
                                name="solution"
                                value={formData.solution}
                                onChange={handleInputChange}
                                className={`textarea textarea-bordered h-24 ${formErrors.solution ? 'textarea-error' : ''}`}
                                placeholder="How did you approach the problem?"
                            ></textarea>
                            {formErrors.solution && (
                                <label className="label">
                                    <span className="label-text-alt text-error">{formErrors.solution}</span>
                                </label>
                            )}
                        </div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Outcome</span>
                            </label>
                            <textarea
                                name="outcome"
                                value={formData.outcome}
                                onChange={handleInputChange}
                                className={`textarea textarea-bordered h-24 ${formErrors.outcome ? 'textarea-error' : ''}`}
                                placeholder="What were the results of your solution?"
                            ></textarea>
                            {formErrors.outcome && (
                                <label className="label">
                                    <span className="label-text-alt text-error">{formErrors.outcome}</span>
                                </label>
                            )}
                        </div>

                        <div className="form-control mb-6">
                            <label className="label cursor-pointer justify-start gap-2">
                                <input
                                    type="checkbox"
                                    name="published"
                                    checked={formData.published}
                                    onChange={handleInputChange}
                                    className="checkbox checkbox-primary"
                                />
                                <span className="label-text">Published</span>
                            </label>
                        </div>

                        <div className="card-actions justify-end">
                            <Link to="/dashboard/case-studies" className="btn btn-ghost">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Saving...
                                    </>
                                ) : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditCaseStudyPage;