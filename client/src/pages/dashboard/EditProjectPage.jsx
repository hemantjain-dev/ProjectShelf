import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

const EditProjectPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        tags: [],
        published: false,
    });
    const [tagInput, setTagInput] = useState('');
    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const [existingThumbnail, setExistingThumbnail] = useState('');
    const [images, setImages] = useState([]);
    const [imagesPreviews, setImagesPreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/api/projects/${id}`);
                const project = response.data;

                setFormData({
                    title: project.title,
                    description: project.description,
                    content: project.content,
                    tags: project.tags || [],
                    published: project.published,
                });

                if (project.thumbnail) {
                    setExistingThumbnail(project.thumbnail);
                }

                if (project.images && project.images.length > 0) {
                    setExistingImages(project.images);
                }
            } catch (err) {
                console.error('Error fetching project:', err);
                setError('Failed to load project. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnail(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImagesChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(prev => [...prev, ...files]);

        // Generate previews
        const newPreviews = [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result);
                if (newPreviews.length === files.length) {
                    setImagesPreviews(prev => [...prev, ...newPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagesPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = async (imageId) => {
        try {
            await api.delete(`/api/media/${imageId}`);
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
        } catch (err) {
            console.error('Error removing image:', err);
            setError('Failed to remove image. Please try again.');
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            // Update the project
            await api.put(`/api/projects/${id}`, formData);

            // Upload new thumbnail if exists
            if (thumbnail) {
                const thumbnailFormData = new FormData();
                thumbnailFormData.append('file', thumbnail);
                thumbnailFormData.append('type', 'thumbnail');

                await api.post(`/api/projects/${id}/media`, thumbnailFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            // Upload additional images if any
            if (images.length > 0) {
                for (const image of images) {
                    const imageFormData = new FormData();
                    imageFormData.append('file', image);
                    imageFormData.append('type', 'gallery');

                    await api.post(`/api/projects/${id}/media`, imageFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                }
            }

            navigate('/dashboard/projects');
        } catch (err) {
            console.error('Error updating project:', err);
            setError(err.response?.data?.message || 'Failed to update project. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold">Edit Project</h1>
                    <p className="text-base-content/70">Update your project details</p>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="bg-base-100 shadow-xl rounded-box p-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="label">
                                <span className="label-text">Project Title</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Enter project title"
                                className="input input-bordered w-full"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="label">
                                <span className="label-text">Short Description</span>
                            </label>
                            <textarea
                                name="description"
                                placeholder="Brief description of your project"
                                className="textarea textarea-bordered w-full"
                                rows="3"
                                value={formData.description}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>

                        <div className="md:col-span-2">
                            <label className="label">
                                <span className="label-text">Project Content</span>
                            </label>
                            <textarea
                                name="content"
                                placeholder="Detailed description of your project"
                                className="textarea textarea-bordered w-full"
                                rows="10"
                                value={formData.content}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text">Thumbnail</span>
                            </label>
                            {existingThumbnail && !thumbnailPreview && (
                                <div className="mb-2">
                                    <p className="text-sm mb-1">Current thumbnail:</p>
                                    <img
                                        src={existingThumbnail}
                                        alt="Current thumbnail"
                                        className="w-32 h-32 object-cover rounded-lg"
                                    />
                                </div>
                            )}
                            <input
                                type="file"
                                className="file-input file-input-bordered w-full"
                                accept="image/*"
                                onChange={handleThumbnailChange}
                            />
                            {thumbnailPreview && (
                                <div className="mt-2">
                                    <p className="text-sm mb-1">New thumbnail:</p>
                                    <img
                                        src={thumbnailPreview}
                                        alt="Thumbnail preview"
                                        className="w-32 h-32 object-cover rounded-lg"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text">Project Images</span>
                            </label>
                            {existingImages.length > 0 && (
                                <div>
                                    <p className="text-sm mb-1">Current images:</p>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        {existingImages.map((image) => (
                                            <div key={image.id} className="relative">
                                                <img
                                                    src={image.url}
                                                    alt={image.alt || "Project image"}
                                                    className="w-full h-24 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 btn btn-circle btn-xs btn-error"
                                                    onClick={() => removeExistingImage(image.id)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                className="file-input file-input-bordered w-full"
                                accept="image/*"
                                multiple
                                onChange={handleImagesChange}
                            />
                            {imagesPreviews.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm mb-1">New images:</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {imagesPreviews.map((preview, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index}`}
                                                    className="w-full h-24 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 btn btn-circle btn-xs btn-error"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="label">
                                <span className="label-text">Tags</span>
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    placeholder="Add tags"
                                    className="input input-bordered flex-1"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                />
                                <button
                                    type="button"
                                    className="btn btn-primary ml-2"
                                    onClick={handleAddTag}
                                >
                                    Add
                                </button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map((tag) => (
                                        <div key={tag} className="badge badge-primary gap-1">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <div className="form-control">
                                <label className="label cursor-pointer justify-start">
                                    <input
                                        type="checkbox"
                                        name="published"
                                        className="checkbox checkbox-primary"
                                        checked={formData.published}
                                        onChange={handleChange}
                                    />
                                    <span className="label-text ml-2">Publish this project (it will be visible on your portfolio)</span>
                                </label>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end space-x-2">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => navigate('/dashboard/projects')}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? <LoadingSpinner size="sm" /> : 'Update Project'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProjectPage;