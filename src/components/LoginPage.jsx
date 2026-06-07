import { useState } from "react";
import { API_BASE_URL } from "../config";

const LoginPage = ({ onLogin, showToast }) => {
  const [activeTab, setActiveTab] = useState("signin"); // "signin" or "signup"
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Helpers
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  const [loading, setLoading] = useState(false);

  // Email format regex check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.length >= 8;
  const isFullNameValid = fullName.trim().length >= 2;
  const isConfirmPasswordValid = password === confirmPassword;

  // Sign In Validation
  const canSubmitSignIn = isEmailValid && isPasswordValid && !loading;

  // Sign Up Validation
  const canSubmitSignUp = 
    isFullNameValid && 
    isEmailValid && 
    isPasswordValid && 
    isConfirmPasswordValid && 
    !loading;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    showToast("Password reset instructions have been simulated! Please check with system administrator.", "info");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === "signin") {
        // Sign In Request
        const res = await fetch(`${API_BASE_URL}/auth/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Login failed");
        }

        showToast("Logged in successfully! Welcome back.", "success");
        onLogin(data.user);
      } else {
        // Sign Up Request
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: fullName, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Registration failed");
        }

        showToast("Account created successfully! Welcome email triggered.", "success");
        
        // Auto-login after successful registration
        onLogin(data.user);
      }
    } catch (err) {
      showToast(err.message, "error");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    // Reset fields and touches
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setTouched({
      fullName: false,
      email: false,
      password: false,
      confirmPassword: false
    });
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="login-left-logo">📰 NewsAI Andhra</div>
        <h2>Stay informed about your region</h2>
        <p>AI-powered news summaries from trusted Telugu and English sources, delivered by district.</p>
        <div className="login-left-sources">
          <span>Powered by local Telugu sources</span>
          <div className="sources-grid">
            <div className="source-tag">Eenadu</div>
            <div className="source-tag">Sakshi</div>
            <div className="source-tag">Andhrajyothy</div>
            <div className="source-tag">Oneindia Telugu</div>
            <div className="source-tag">NTV Telugu</div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-box">
          
          {/* Sign In vs Sign Up Tabs Switcher */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === "signin" ? "active" : ""}`}
              onClick={() => switchTab("signin")}
              disabled={loading}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => switchTab("signup")}
              disabled={loading}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {activeTab === "signup" && (
              <div className="form-group">
                <label htmlFor="fullname-input">Full Name</label>
                <input
                  id="fullname-input"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => handleBlur("fullName")}
                  className={touched.fullName && !isFullNameValid ? "input-error" : ""}
                  disabled={loading}
                  required
                />
                {touched.fullName && !isFullNameValid && (
                  <span className="error-message">Name must be at least 2 characters.</span>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email-input">Email Address</label>
              <input
                id="email-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                className={touched.email && !isEmailValid ? "input-error" : ""}
                disabled={loading}
                required
              />
              {touched.email && !isEmailValid && (
                <span className="error-message">Please enter a valid email address.</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password-input">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder={activeTab === "signin" ? "Enter your password" : "Create password (min 8 characters)"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  className={touched.password && !isPasswordValid ? "input-error" : ""}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {touched.password && !isPasswordValid && (
                <span className="error-message">Password must be at least 8 characters.</span>
              )}
            </div>

            {activeTab === "signup" && (
              <div className="form-group">
                <label htmlFor="confirm-password-input">Confirm Password</label>
                <input
                  id="confirm-password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur("confirmPassword")}
                  className={touched.confirmPassword && !isConfirmPasswordValid ? "input-error" : ""}
                  disabled={loading}
                  required
                />
                {touched.confirmPassword && !isConfirmPasswordValid && (
                  <span className="error-message">Passwords do not match.</span>
                )}
              </div>
            )}

            {activeTab === "signin" ? (
              <div className="form-helper-row">
                <label className="remember-me">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  /> Remember me
                </label>
                <button 
                  type="button" 
                  className="forgot-password-link" 
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Forgot Password?
                </button>
              </div>
            ) : (
              <div style={{ margin: "1rem 0" }}></div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={activeTab === "signin" ? !canSubmitSignIn : !canSubmitSignUp}
            >
              {loading ? "Processing..." : activeTab === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="login-divider">Credentials validated via secure server</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;