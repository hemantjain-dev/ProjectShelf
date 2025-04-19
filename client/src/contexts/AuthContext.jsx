import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserProfile(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = async (token) => {
        try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await api.get('/api/users/me');
            setCurrentUser(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            localStorage.removeItem('token');
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await api.post('/api/users/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setCurrentUser(user);
            navigate('/dashboard');
            return user;
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed');
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            const response = await api.post('/api/users/register', userData);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setCurrentUser(user);
            navigate('/dashboard');
            return user;
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed');
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setCurrentUser(null);
        navigate('/login');
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await api.put('/api/users/profile', profileData);
            setCurrentUser(response.data);
            return response.data;
        } catch (error) {
            setError(error.response?.data?.message || 'Profile update failed');
            throw error;
        }
    };

    const value = {
        currentUser,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};