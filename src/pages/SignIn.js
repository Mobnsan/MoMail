import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      await login({ email: email.trim(), password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    }
  }

  return (
    <div className="App auth-page">
      <div className="auth-card">
        <h1>Sign In</h1>
        <p>Sign in to manage your email campaigns and contact lists.</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="button" type="submit">
            Sign In
          </button>
        </form>
        <div className="footer-note">
          New to MoMail? <Link to="/signup">Create an account.</Link>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
