import React, { useState } from 'react';
import { Check, Download, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { ReplacementPolicy } from '../types/academic';
import { Avatar } from '../components/Avatar';

const SAMPLE_AVATAR_URL = '/src/assets/images/avatar_student_atasi_1795098737298.jpg';

export function SettingsPage() {
  const {
    profile,
    rules,
    gradeScale,
    semesters,
    courses,
    updateProfile,
    updateRules,
    updateGradeScale,
    resetGradeScale,
    resetToDemoData,
    clearAllData,
    logout,
  } = useAcademic();

  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [university, setUniversity] = useState(profile.university);
  const [department, setDepartment] = useState(profile.department);
  const [studentId, setStudentId] = useState(profile.studentId);
  const [currentSemester, setCurrentSemester] = useState(String(profile.currentSemester));
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(profile.avatarUrl);
  const [avatarError, setAvatarError] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be 2 MB or smaller.');
      return;
    }
    setAvatarError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        updateProfile({ avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleKeepBlankAvatar = () => {
    setAvatarError('');
    setAvatarUrl(undefined);
    updateProfile({ avatarUrl: undefined });
  };

  const handleUseSampleAvatar = () => {
    setAvatarError('');
    setAvatarUrl(SAMPLE_AVATAR_URL);
    updateProfile({ avatarUrl: SAMPLE_AVATAR_URL });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: fullName.trim() || profile.fullName,
      email: email.trim() || profile.email,
      university: university.trim() || profile.university,
      department: department.trim() || profile.department,
      studentId: studentId.trim() || profile.studentId,
      currentSemester: Math.max(1, Number(currentSemester) || 1),
      avatarUrl,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      rules,
      gradeScale,
      semesters,
      courses,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradepath-academic-record-${profile.studentId || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D]">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#29232D]">
          Settings &amp; Academic Policies
        </h2>
        <p className="mt-1 text-sm font-medium text-[#29232D]/75">
          Manage your student profile, configure university grading and retake policies, or export your data.
        </p>
      </div>

      {/* Student Profile */}
      <section className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D]">
        <div className="flex items-center justify-between border-b-2 border-[#29232D]/10 pb-4">
          <div>
            <h3 className="font-display text-base font-extrabold text-[#29232D]">Student Profile</h3>
            <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
              Personal and university enrollment details
            </p>
          </div>
          {savedBanner && (
            <span className="inline-flex items-center gap-1 rounded-lg border-2 border-[#29232D] bg-[#A7D9AE] px-2.5 py-1 text-xs font-bold text-[#29232D]">
              <Check className="h-3.5 w-3.5" />
              Profile saved
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-5">
          {/* Profile Picture Picker */}
          <div className="rounded-2xl border-2 border-[#29232D] bg-[#FCE2DE]/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={fullName || profile.fullName} src={avatarUrl} size="lg" />
              <div>
                <p className="text-xs font-extrabold text-[#29232D]">Profile Picture</p>
                <p className="text-xs font-medium text-[#29232D]/75 mt-0.5">
                  {avatarUrl
                    ? 'Custom photo selected · Visible in sidebar and profile menu'
                    : 'Currently blank · Upload a photo or keep it blank'}
                </p>
                {avatarError && (
                  <p className="text-xs font-bold text-[#991B1B] mt-1">{avatarError}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <label className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-white px-3 py-1.5 text-xs font-bold text-[#29232D] hover:bg-[#F6D36B] cursor-pointer transition-colors whitespace-nowrap">
                <Upload className="h-3.5 w-3.5" />
                Choose Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="sr-only"
                />
              </label>

              {avatarUrl !== SAMPLE_AVATAR_URL && (
                <button
                  type="button"
                  onClick={handleUseSampleAvatar}
                  className="rounded-xl border-2 border-[#29232D] bg-white px-3 py-1.5 text-xs font-bold text-[#29232D] hover:bg-[#E5D8F3] transition-colors whitespace-nowrap"
                >
                  Use Sample Portrait
                </button>
              )}

              <button
                type="button"
                onClick={handleKeepBlankAvatar}
                disabled={!avatarUrl}
                className="inline-flex items-center gap-1 rounded-xl border-2 border-[#29232D] bg-white px-3 py-1.5 text-xs font-bold text-[#29232D] hover:bg-[#F8D0CC] disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                <X className="h-3.5 w-3.5" />
                Keep Blank
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-medium text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-medium text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                University
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-medium text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-medium text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Current Semester Number
              </label>
              <input
                type="number"
                min="1"
                max="16"
                value={currentSemester}
                onChange={(e) => setCurrentSemester(e.target.value)}
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#29232D] transition-all"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </section>

      {/* Academic Rules */}
      <section className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D]">
        <div className="border-b-2 border-[#29232D]/10 pb-4">
          <h3 className="font-display text-base font-extrabold text-[#29232D]">
            Academic Improvement &amp; Retake Rules
          </h3>
          <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
            Different universities enforce different eligibility windows and grade replacement policies
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#29232D] mb-1.5">
              Improvement Max Grade Point (&lt; GP)
            </label>
            <input
              type="number"
              step="0.25"
              min="2.0"
              max="4.0"
              value={rules.improvementMaxPoint}
              onChange={(e) =>
                updateRules({ improvementMaxPoint: Number(e.target.value) || 3.0 })
              }
              className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#29232D] mb-1.5">
              Improvement Batch Window
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={rules.improvementBatchWindow}
              onChange={(e) =>
                updateRules({
                  improvementBatchWindow: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#29232D] mb-1.5">
              Failed/Retake Batch Window
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={rules.retakeBatchWindow}
              onChange={(e) =>
                updateRules({
                  retakeBatchWindow: Math.max(1, Number(e.target.value) || 2),
                })
              }
              className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#29232D] mb-1.5">
              Minimum Internal Marks (/30)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={rules.minInternalMarks}
              onChange={(e) =>
                updateRules({
                  minInternalMarks: Math.max(0, Math.min(30, Number(e.target.value) || 0)),
                })
              }
              className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#29232D] mb-1.5">
              Grade Replacement Policy
            </label>
            <select
              value={rules.replacementPolicy}
              onChange={(e) =>
                updateRules({ replacementPolicy: e.target.value as ReplacementPolicy })
              }
              className="w-full rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-sm font-bold text-[#29232D]"
            >
              <option value="replace_old">
                Replace Old Grade (New grade replaces original grade in CGPA)
              </option>
              <option value="best_grade">
                Best Grade Wins (Higher grade between original and retake counts)
              </option>
              <option value="average_attempts">
                Average of Attempts (Mean of original and retake grade points)
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* Grading Scale Table */}
      <section className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#29232D]/10 pb-4">
          <div>
            <h3 className="font-display text-base font-extrabold text-[#29232D]">
              University Grading Scale
            </h3>
            <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
              Customize minimum marks or grade points for your department
            </p>
          </div>
          <button
            type="button"
            onClick={resetGradeScale}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] px-3 py-1.5 text-xs font-bold text-[#29232D] hover:bg-[#F8D0CC]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Default Scale
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-[#29232D] bg-[#F5F3F2] text-[#29232D] font-extrabold uppercase tracking-wide">
                <th className="py-2.5 px-3">Min Marks</th>
                <th className="py-2.5 px-3">Max Marks</th>
                <th className="py-2.5 px-3">Letter Grade</th>
                <th className="py-2.5 px-3">Grade Point</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#29232D]/10 font-mono tabular-nums">
              {gradeScale.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.minMarks}
                      onChange={(e) => {
                        const next = [...gradeScale];
                        next[idx] = { ...row, minMarks: Number(e.target.value) || 0 };
                        updateGradeScale(next);
                      }}
                      className="w-20 rounded-lg border-2 border-[#29232D] px-2 py-1 font-bold text-[#29232D]"
                    />
                  </td>
                  <td className="py-2 px-3 font-bold text-[#29232D]/70">{row.maxMarks}</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={row.letter}
                      onChange={(e) => {
                        const next = [...gradeScale];
                        next[idx] = { ...row, letter: e.target.value };
                        updateGradeScale(next);
                      }}
                      className="w-16 rounded-lg border-2 border-[#29232D] px-2 py-1 text-[#29232D] font-extrabold"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="4"
                      value={row.point}
                      onChange={(e) => {
                        const next = [...gradeScale];
                        next[idx] = { ...row, point: Number(e.target.value) || 0 };
                        updateGradeScale(next);
                      }}
                      className="w-20 rounded-lg border-2 border-[#29232D] px-2 py-1 font-bold text-[#29232D]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Data & Account Actions */}
      <section className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D]">
        <h3 className="font-display text-base font-extrabold text-[#29232D]">
          Workspace Data &amp; Session
        </h3>
        <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
          All data persists locally in your browser. Export a backup or test authentication screens.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#E5D8F3] px-4 py-2 text-xs font-bold text-[#29232D] hover:bg-[#7955A1] hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export Academic Record (JSON)
          </button>

          <button
            type="button"
            onClick={resetToDemoData}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#FFF4D6] px-4 py-2 text-xs font-bold text-[#29232D] hover:bg-[#F6D36B] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore Demo Academic Data
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] px-4 py-2 text-xs font-bold text-[#991B1B] hover:bg-[#F8D0CC]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All Courses &amp; Semesters
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#F8D0CC] px-3 py-1.5 text-xs">
              <span className="text-[#29232D] font-bold">Clear everything?</span>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setConfirmClear(false);
                }}
                className="font-extrabold text-[#991B1B] hover:underline"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="font-bold text-[#29232D] hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            className="ml-auto rounded-xl border-2 border-[#29232D] bg-[#29232D] px-4 py-2 text-xs font-bold text-white hover:bg-[#7955A1] transition-colors"
          >
            Sign Out / View Auth Pages
          </button>
        </div>
      </section>
    </div>
  );
}
