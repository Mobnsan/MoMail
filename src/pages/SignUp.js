import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api';

function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      await signup({ name: name.trim(), email: email.trim(), password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Unable to create account.');
    }
  }

  return (
    <div className="App auth-page">
      <div className="auth-card">
        <h1>Create an account</h1>
        <p>Save contacts, build templates, and run campaigns with real backend auth.</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            Create account
          </button>
        </form>
        <div className="footer-note">
          Already have an account? <Link to="/signin">Sign in.</Link>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
