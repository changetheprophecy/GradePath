import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Globe, Upload, X } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { Logo } from '../components/Logo';
import { Avatar } from '../components/Avatar';

export function AuthPage() {
  const { authView, setAuthView, login, signup, resetToDemoData, openLanding } = useAcademic();

  // Login state
  const [loginEmail, setLoginEmail] = useState('atasi2002@gmail.com');
  const [loginPassword, setLoginPassword] = useState('••••••••••');
  const [loginError, setLoginError] = useState('');

  // Signup state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [currentSemester, setCurrentSemester] = useState('1');
  const [signupAvatarUrl, setSignupAvatarUrl] = useState<string | undefined>(undefined);
  const [signupError, setSignupError] = useState('');

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both your email address and password.');
      return;
    }
    setLoginError('');
    login(loginEmail);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !fullName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !university.trim() ||
      !department.trim() ||
      !studentId.trim()
    ) {
      setSignupError('Please complete all required student enrollment fields.');
      return;
    }
    if (password.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }
    setSignupError('');
    signup({
      fullName: fullName.trim(),
      email: email.trim(),
      university: university.trim(),
      department: department.trim(),
      studentId: studentId.trim(),
      currentSemester: Math.max(1, Number(currentSemester) || 1),
      avatarUrl: signupAvatarUrl,
    });
  };

  const handleSignupAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSignupError('Please choose a valid image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSignupError('Profile picture must be 2 MB or smaller.');
      return;
    }
    setSignupError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSignupAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Please enter a valid university email address.');
      return;
    }
    setResetError('');
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-[#F8D0CC] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1100px] flex items-center justify-between">
        <button type="button" onClick={openLanding} className="focus:outline-none">
          <Logo />
        </button>
        <button
          type="button"
          onClick={openLanding}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-white px-3.5 py-2 text-xs font-bold text-[#29232D] hover:bg-[#FCE2DE] transition-colors"
        >
          <Globe className="h-3.5 w-3.5" />
          Back to Website
        </button>
      </div>

      <div className="my-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#29232D]">
            {authView === 'login'
              ? 'Sign in to GradePath'
              : authView === 'signup'
                ? 'Create your account'
                : 'Reset your password'}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-[#29232D]/80">
            {authView === 'login'
              ? 'Track semester GPA, predict finals, and plan grade improvements.'
              : authView === 'signup'
                ? 'Configure your university profile to start planning your degree.'
                : 'Enter your registered email to receive a password reset link.'}
          </p>
        </div>

        <div className="rounded-[24px] border-2 border-[#29232D] bg-white p-6 sm:p-8 shadow-[6px_6px_0_#29232D]">
          {authView === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="rounded-xl border-2 border-[#29232D] bg-[#F8D0CC] px-3 py-2 text-xs font-bold text-[#29232D]">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full rounded-xl border-2 border-[#29232D] px-3.5 py-2.5 text-sm font-medium text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#29232D]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      setAuthView('forgot-password');
                    }}
                    className="text-xs font-bold text-[#7955A1] hover:text-[#29232D]"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-[#29232D] px-3.5 py-2.5 text-sm text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-3 font-display text-sm font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#29232D] transition-all"
              >
                Sign in
              </button>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    resetToDemoData();
                    login('atasi2002@gmail.com');
                  }}
                  className="w-full rounded-xl border-2 border-[#29232D] bg-[#F6D36B] px-4 py-2.5 text-xs font-bold text-[#29232D] hover:bg-[#FCE2DE] transition-colors"
                >
                  Continue with Demo Student (Atasi Saha)
                </button>
              </div>

              <p className="pt-2 text-center text-xs font-medium text-[#29232D]/70">
                New to GradePath?{' '}
                <button
                  type="button"
                  onClick={() => setAuthView('signup')}
                  className="font-bold text-[#7955A1] hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {authView === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              {signupError && (
                <div className="rounded-xl border-2 border-[#29232D] bg-[#F8D0CC] px-3 py-2 text-xs font-bold text-[#29232D]">
                  {signupError}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={fullName || 'Student'} src={signupAvatarUrl} size="md" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#29232D]">
                      Profile Picture (Optional)
                    </p>
                    <p className="text-[11px] font-medium text-[#29232D]/70 truncate">
                      {signupAvatarUrl ? 'Picture selected' : 'Keeping blank'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="inline-flex items-center gap-1 rounded-lg border-2 border-[#29232D] bg-white px-2.5 py-1.5 text-xs font-bold text-[#29232D] hover:bg-[#F5F3F2] cursor-pointer whitespace-nowrap">
                    <Upload className="h-3 w-3" />
                    Choose
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignupAvatarChange}
                      className="sr-only"
                    />
                  </label>
                  {signupAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setSignupAvatarUrl(undefined)}
                      className="inline-flex items-center gap-1 rounded-lg border-2 border-[#29232D] bg-white px-2 py-1.5 text-xs text-[#29232D] hover:bg-[#F5F3F2]"
                      aria-label="Keep profile picture blank"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#29232D] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Olivia Rodrigo"
                  className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm text-[#29232D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#29232D] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="olivia@university.edu"
                  className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm text-[#29232D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#29232D] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm text-[#29232D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#29232D] mb-1">
                  University
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="National Institute of Technology & Science"
                  className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm text-[#29232D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#29232D] mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Science"
                    className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm text-[#29232D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#29232D] mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="CSE-2023-0418"
                    className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold text-[#29232D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#29232D] mb-1">
                  Current Semester
                </label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2.5 font-display text-sm font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] transition-all mt-2"
              >
                Create Account
              </button>

              <p className="pt-2 text-center text-xs font-medium text-[#29232D]/70">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  className="font-bold text-[#7955A1] hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {authView === 'forgot-password' && (
            <div className="space-y-4">
              {resetSent ? (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-[#7955A1]" />
                  <h3 className="font-display text-base font-bold text-[#29232D]">
                    Reset instructions sent
                  </h3>
                  <p className="text-xs text-[#29232D]/80">
                    If an account exists for <span className="font-bold">{resetEmail}</span>, a password reset link has been dispatched.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAuthView('login')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7955A1] hover:underline pt-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  {resetError && (
                    <div className="rounded-xl border-2 border-[#29232D] bg-[#F8D0CC] px-3 py-2 text-xs font-bold text-[#29232D]">
                      {resetError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                      Registered Email Address
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full rounded-xl border-2 border-[#29232D] px-3.5 py-2.5 text-sm text-[#29232D] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2.5 font-display text-sm font-bold text-white shadow-[3px_3px_0_#29232D]"
                  >
                    Send Reset Link
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthView('login')}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#29232D]/80 hover:text-[#29232D] pt-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Return to sign in
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-xs font-semibold text-[#29232D]/70">
        GradePath Academic Performance &amp; Planning Platform
      </div>
    </div>
  );
}
