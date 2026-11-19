import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, ArrowRight, ShieldCheck, BarChart3, PackageCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FruitBasket from '../components/FruitBasket';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <aside className="login-showcase">
          <div className="login-top">
            <div className="login-brand">
              <div className="brand-mark"><Apple size={22} /></div>
              <div>
                <strong>Batloung Farm</strong>
                <span>Distribution Management</span>
              </div>
            </div>
            <div className="three-dots" aria-hidden="true"><i /><i /><i /></div>
          </div>

          <div className="showcase-copy">
            <span className="section-kicker">Fresh and healthy</span>
            <h1>Fruit</h1>
            <p>Stock, suppliers, vendors, sales and reports in one workspace.</p>
          </div>

          <div className="showcase-art">
            <span className="poster-dots d1" aria-hidden="true" />
            <span className="poster-dots d2" aria-hidden="true" />
            <FruitBasket />
          </div>

          <div className="showcase-features">
            <div><ShieldCheck size={16} /><span>Secure access</span></div>
            <div><PackageCheck size={16} /><span>Stock visibility</span></div>
            <div><BarChart3 size={16} /><span>Clear reports</span></div>
          </div>
        </aside>

        <section className="login-card">
          <div className="login-heading">
            <span className="section-kicker">Welcome back</span>
            <h2>Sign in</h2>
            <p>Enter your credentials to access management tools.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username or Email</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="demo-note">
            <strong>Demo access</strong>
            <span>Admin: <code>admin</code> / <code>admin123</code></span>
            <span>Sales: <code>sales1</code> / <code>sales123</code></span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
