import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleAuthButton from '../component/GoogleAuthButton';

const Login = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      navigate('/dashboard');
    }
  }, [navigate]);

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-200 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full">
        <div className="text-center">
          <img
            src="https://media.licdn.com/dms/image/v2/D4D16AQHJgOXbNphS3w/profile-displaybackgroundimage-shrink_350_1400/profile-displaybackgroundimage-shrink_350_1400/0/1713779956222?e=1752710400&v=beta&t=dTevDRIKHUslfUcCT0qc8Xfh9kGOkmu_rVP7ncN5W-s"
            alt="Your Business Logo"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-800">Welcome to atoselr</h1>
          <p className="text-gray-600 mt-2">
            Sell smarter, not harder – with AI on Chat.
          </p>
        </div>

        <div className="mt-8">
          {isLoggedIn ? (
            <div className="text-center text-gray-700 text-lg">Redirecting to Dashboard...</div>
          ) : (
            <div className="flex flex-col gap-4 items-center">
              <GoogleAuthButton/>
              <p className="text-sm text-gray-500">Secure login with Google</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
