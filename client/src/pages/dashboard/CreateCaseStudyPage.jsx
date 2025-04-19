import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const CreateCaseStudyPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
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

        try {
            const response = await api.post('/api/case-studies', formData);
            navigate(`/dashboard/case-studies/edit/${response.data.id}`, {
                state: { message: 'Case study created successfully!' }
            });
        } catch (error) {
            console.error('Error creating case study:', error);
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Create New Case Study</h1>
                <Link to="/dashboard/case-studies" className="btn btn-ghost">
                    Cancel
                </Link>
            </div>

            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : (
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
                                        placeholder="Enter a title for your case study"
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
                                        {Array.isArray(projects) ? projects.map(project => (
                                            <option key={project.id || project._id} value={project.id || project._id}>
                                                {project.title}
                                            </option>
                                        )) : (
                                            <option value="" disabled>No projects available</option>
                                        )}
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
                                    <span className="label-text">Publish immediately</span>
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
                                            Creating...
                                        </>
                                    ) : 'Create Case Study'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
const fetchProjects = async () => {
    setLoading(true);
    try {
        const response = await api.get('/api/projects');

        // Ensure projects is an array
        const projectsData = Array.isArray(response.data)
            ? response.data
            : (response.data.projects || []);

        console.log('Projects data:', projectsData);
        setProjects(projectsData);
    } catch (error) {
        console.error('Error fetching projects:', error);
    } finally {
        setLoading(false);
    }
};
export default CreateCaseStudyPage;