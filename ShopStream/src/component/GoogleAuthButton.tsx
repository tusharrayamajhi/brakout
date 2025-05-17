import { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GoogleAuthButton = () => {
  const navigate = useNavigate();

  useEffect(() => {
    /* global google */
    // @ts-ignore
    google.accounts.id.initialize({
      client_id: '611314394373-9798ed04r97o4vj3mocii2orqbvh7em0.apps.googleusercontent.com',
      callback: async (response: any) => {
        try {
          const { data } = await axios.post('http://localhost:3000/auth/google', {
            credential: response.credential,
          });

          sessionStorage.setItem('token', data.token);
          navigate('/dashboard');
        } catch (err) {
          console.error('Login failed', err);
        }
      },
    });

    // @ts-ignore
    google.accounts.id.renderButton(document.getElementById('google-button'), {
      theme: 'filled_blue',
      size: 'large',
      shape: 'pill',
      width: 280,
    });
  }, [navigate]);

  return (
    <div className="flex flex-col items-center">
      <p className="text-gray-600 text-sm mb-2">Continue with Google</p>
      <div
        id="google-button"
        className="transition-transform hover:scale-105 shadow-md rounded-full"
      ></div>
    </div>
  );
};

export default GoogleAuthButton;
