import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Semester, SemesterStatus } from '../types/academic';

interface SemesterModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Semester, 'id'>) => void;
  initial?: Semester | null;
  suggestedNumber: number;
}

export function SemesterModal({
  open,
  onClose,
  onSave,
  initial,
  suggestedNumber,
}: SemesterModalProps) {
  const [number, setNumber] = useState<number>(suggestedNumber);
  const [name, setName] = useState<string>(`Semester ${suggestedNumber}`);
  const [status, setStatus] = useState<SemesterStatus>('in_progress');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (initial) {
        setNumber(initial.number);
        setName(initial.name);
        setStatus(initial.status);
      } else {
        setNumber(suggestedNumber);
        setName(`Semester ${suggestedNumber}`);
        setStatus('in_progress');
      }
      setError('');
    }
  }, [open, initial, suggestedNumber]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a semester name.');
      return;
    }
    if (number < 1 || number > 20) {
      setError('Semester number must be between 1 and 20.');
      return;
    }
    onSave({
      number: Number(number),
      name: name.trim(),
      status,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#29232D]/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="semester-modal-title"
    >
      <div className="w-full max-w-md rounded-[22px] border-2 border-[#29232D] bg-white p-6 shadow-[6px_6px_0_#29232D]">
        <div className="flex items-center justify-between border-b-2 border-[#29232D]/15 pb-4">
          <h2 id="semester-modal-title" className="font-display text-lg font-extrabold text-[#29232D]">
            {initial ? 'Edit Semester' : 'Add New Semester'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] p-1.5 text-[#29232D] hover:bg-[#F8D0CC] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-xl border-2 border-[#29232D] bg-[#F8D0CC] px-3 py-2 text-xs font-bold text-[#29232D]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Order #
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={number}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setNumber(n);
                  if (!initial && name.startsWith('Semester ')) {
                    setName(`Semester ${n || ''}`);
                  }
                }}
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm text-[#29232D] font-mono font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Semester Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Semester 7"
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-medium text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#29232D] mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SemesterStatus)}
              className="w-full rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-sm font-semibold text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
            >
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="planned">Planned</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-[#29232D]/15">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-[#29232D] bg-white px-4 py-2 text-sm font-bold text-[#29232D] hover:bg-[#F5F3F2] transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#29232D] transition-all whitespace-nowrap"
            >
              {initial ? 'Save Changes' : 'Create Semester'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
