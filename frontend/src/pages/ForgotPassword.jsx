import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await axios.post('/organizer/request-password-reset', {
                email,
                reason,
                contactNumber
            });

            setMessage({
                type: 'success',
                text: 'Password reset request submitted successfully! An admin will review your request and you will receive a new password.'
            });

            // Clear form
            setEmail('');
            setReason('');
            setContactNumber('');
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to submit request. Make sure you are a registered organizer.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Forgot Password? 🔑
                    </h1>
                    <p className="text-gray-600">
                        Organizer password reset request
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Info Box */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                        <p className="text-blue-700 text-sm">
                            <strong>Note:</strong> This is for organizers only. Submit a request and an admin will review it.
                            Once approved, you'll receive a new password.
                        </p>
                    </div>

                    {/* Success/Error Message */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded ${message.type === 'success'
                                ? 'bg-green-50 border-l-4 border-green-500 text-green-700'
                                : 'bg-red-50 border-l-4 border-red-500 text-red-700'
                            }`}>
                            <p className="text-sm">{message.text}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Registered Email Address *
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="organizer@example.com"
                                required
                            />
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Reset *
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Forgot password, account locked, etc."
                                rows={3}
                                required
                            />
                        </div>

                        {/* Contact Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Number (optional)
                            </label>
                            <input
                                type="tel"
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="+91 XXXXXXXXXX"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Reset Request'}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                            ← Back to Login
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Felicity Event Management System</p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
