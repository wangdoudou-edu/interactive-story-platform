import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import './LoginPage.css';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || t('login.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg">
                <div className="login-bg-gradient"></div>
                <div className="login-bg-grid"></div>
            </div>

            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">
                        <span className="logo-icon">🤖</span>
                        <span className="logo-text">AIMind Studio</span>
                    </div>
                    <h1>{t('login.subtitle')}</h1>
                    <p>{t('login.features')}</p>
                </div>

                <div className="login-card">
                    <div className="login-title">
                        <h2>{t('login.title')}</h2>
                        <p className="login-hint">{t('login.hint')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label>{t('login.usernameLabel')}</label>
                            <input
                                type="text"
                                className="input"
                                placeholder={t('login.usernamePlaceholder')}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('login.passwordLabel')}</label>
                            <input
                                type="password"
                                className="input"
                                placeholder={t('login.passwordPlaceholder')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-primary submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                t('login.submitBtn')
                            )}
                        </button>
                    </form>
                </div>

                <div className="login-footer">
                    <p>{t('login.footer')}</p>
                </div>
            </div>
        </div>
    );
}
