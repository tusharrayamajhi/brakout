import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../api/api_url';

const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = sessionStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    const checkBusinessProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}businesses/checkbusinessprofile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response)

        // Redirect to business details form if business info is missing
        if (!response) {
          if (location.pathname !== '/business-details') {
            navigate('/business-details');
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        sessionStorage.removeItem('token');
        navigate('/');
      }
    };

    checkBusinessProfile();
  }, [navigate, location.pathname]);
};

export default useAuth;
