import { useState } from 'react';
import { authApi } from '../services/api';
import './LoginPage.css';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authApi.login(username, password);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || '登录失败');
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
                        <span className="logo-text">AI-LOP</span>
                    </div>
                    <h1>AI 协作学习平台</h1>
                    <p>多AI对话 · 智能批注 · 创意整合</p>
                </div>

                <div className="login-card">
                    <div className="login-title">
                        <h2>账号登录</h2>
                        <p className="login-hint">请使用教师分配的账号登录</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label>用户名</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="请输入用户名"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>密码</label>
                            <input
                                type="password"
                                className="input"
                                placeholder="请输入密码"
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
                                '登录'
                            )}
                        </button>
                    </form>
                </div>

                <div className="login-footer">
                    <p>开启你的 AI 协作学习之旅</p>
                </div>
            </div>
        </div>
    );
}
