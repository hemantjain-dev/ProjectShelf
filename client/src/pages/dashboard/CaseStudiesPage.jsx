import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

const CaseStudiesPage = () => {
    const [caseStudies, setCaseStudies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCaseStudies();
    }, []);

    const fetchCaseStudies = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/case-studies');

            // Ensure we're setting an array
            const data = Array.isArray(response.data)
                ? response.data
                : (response.data.caseStudies || []);

            setCaseStudies(data);
        } catch (err) {
            console.error('Error fetching case studies:', err);
            setError(err.response?.data?.message || 'Failed to load case studies');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCaseStudy = async (id) => {
        if (window.confirm('Are you sure you want to delete this case study?')) {
            try {
                await api.delete(`/api/case-studies/${id}`);
                fetchCaseStudies(); // Refresh the list
            } catch (err) {
                console.error('Error deleting case study:', err);
                setError(err.response?.data?.message || 'Failed to delete case study');
            }
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredCaseStudies = () => {
        // Ensure caseStudies is an array before filtering
        if (!Array.isArray(caseStudies)) {
            console.error('caseStudies is not an array:', caseStudies);
            return [];
        }

        return caseStudies.filter(study => {
            const matchesFilter =
                filter === 'all' ||
                (filter === 'published' && study.published) ||
                (filter === 'drafts' && !study.published);

            const matchesSearch =
                study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (study.description && study.description.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesFilter && matchesSearch;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold">Case Studies</h1>
                    <p className="text-base-content/70">Manage your project case studies</p>
                </div>
                <Link to="/dashboard/case-studies/create" className="btn btn-primary mt-2 md:mt-0">
                    Create New Case Study
                </Link>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="tabs tabs-boxed">
                    <button
                        className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`tab ${filter === 'published' ? 'tab-active' : ''}`}
                        onClick={() => setFilter('published')}
                    >
                        Published
                    </button>
                    <button
                        className={`tab ${filter === 'drafts' ? 'tab-active' : ''}`}
                        onClick={() => setFilter('drafts')}
                    >
                        Drafts
                    </button>
                </div>

                <div className="form-control w-full md:w-auto">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Search case studies..."
                            className="input input-bordered"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        <button className="btn btn-square">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <>
                    {Array.isArray(caseStudies) && caseStudies.length === 0 ? (
                        <div className="bg-base-100 shadow-xl rounded-box p-8 text-center">
                            <h2 className="text-xl font-semibold mb-2">No case studies yet</h2>
                            <p className="mb-4">Create your first case study to showcase your project details</p>
                            <Link to="/dashboard/case-studies/create" className="btn btn-primary">
                                Create New Case Study
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCaseStudies().map(study => (
                                <div key={study.id} className="card bg-base-100 shadow-xl">
                                    <div className="card-body">
                                        <h2 className="card-title">
                                            {study.title}
                                            {study.published ? (
                                                <div className="badge badge-success">Published</div>
                                            ) : (
                                                <div className="badge badge-ghost">Draft</div>
                                            )}
                                        </h2>
                                        <p className="line-clamp-2">{study.description}</p>

                                        {study.projectId && (
                                            <div className="text-sm text-base-content/70">
                                                Project: {study.project?.title || 'Unknown Project'}
                                            </div>
                                        )}

                                        <div className="card-actions justify-end mt-4">
                                            <Link to={`/case-studies/${study.id}`} className="btn btn-sm btn-ghost">
                                                View
                                            </Link>
                                            <Link to={`/dashboard/case-studies/edit/${study.id}`} className="btn btn-sm btn-primary">
                                                Edit
                                            </Link>
                                            <button
                                                className="btn btn-sm btn-error"
                                                onClick={() => handleDeleteCaseStudy(study.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CaseStudiesPage;