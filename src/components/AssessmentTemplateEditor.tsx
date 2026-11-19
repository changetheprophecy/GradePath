import React from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { AssessmentKind, AssessmentTemplateComponent } from '../types/academic';
import { ASSESSMENT_PRESETS } from '../utils/calculations';

interface AssessmentTemplateEditorProps {
  template: AssessmentTemplateComponent[];
  onChange: (next: AssessmentTemplateComponent[]) => void;
  onReset: () => void;
}

export function AssessmentTemplateEditor({
  template,
  onChange,
  onReset,
}: AssessmentTemplateEditorProps) {
  const totalMax = Math.round(
    template.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0) * 100
  ) / 100;

  const updateItem = (idx: number, patch: Partial<AssessmentTemplateComponent>) => {
    onChange(template.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const addItem = (presetName: string, kind: AssessmentKind, maxMarks: number) => {
    let finalName = presetName;
    if (kind === 'midterm') {
      const count = template.filter((c) => c.kind === 'midterm').length;
      finalName = `Midterm ${count + 1}`;
    } else if (template.some((c) => c.name.toLowerCase() === presetName.toLowerCase())) {
      const count = template.filter((c) =>
        c.name.toLowerCase().startsWith(presetName.toLowerCase())
      ).length;
      finalName = `${presetName} ${count + 1}`;
    }

    onChange([
      ...template,
      {
        id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: finalName,
        kind,
        maxMarks,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (template.length <= 1) return;
    onChange(template.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Apply assessment template preset"
            defaultValue=""
            onChange={(e) => {
              const preset = ASSESSMENT_PRESETS.find((p) => p.id === e.target.value);
              if (preset) onChange(preset.components);
              e.target.value = '';
            }}
            className="rounded-xl border-2 border-[#29232D] bg-[#FFF4D6] px-3 py-1.5 text-xs font-bold text-[#29232D] focus:outline-none"
          >
            <option value="">Apply Quick Preset…</option>
            {ASSESSMENT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <span className="rounded-lg border-2 border-[#29232D] bg-[#E5D8F3] px-2.5 py-1 text-xs font-mono font-extrabold text-[#29232D] tabular-nums">
            Total Marks: {totalMax}
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] px-3 py-1.5 text-xs font-bold text-[#29232D] hover:bg-[#F8D0CC]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Default
        </button>
      </div>

      <div className="rounded-2xl border-2 border-[#29232D] bg-[#F5F3F2] p-3 space-y-2">
        {template.map((comp, idx) => (
          <div
            key={comp.id}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center rounded-xl border border-[#29232D]/25 bg-white p-2.5"
          >
            <div className="sm:col-span-5">
              <input
                type="text"
                value={comp.name}
                onChange={(e) => updateItem(idx, { name: e.target.value })}
                aria-label={`Default component ${idx + 1} name`}
                className="w-full rounded-lg border-2 border-[#29232D]/30 px-2.5 py-1.5 text-xs font-bold text-[#29232D] focus:border-[#29232D] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-4">
              <select
                value={comp.kind}
                onChange={(e) =>
                  updateItem(idx, { kind: e.target.value as AssessmentKind })
                }
                aria-label={`Default component ${idx + 1} type`}
                className="w-full rounded-lg border-2 border-[#29232D]/30 bg-[#F5F3F2] px-2 py-1.5 text-xs font-bold text-[#29232D] focus:border-[#29232D] focus:outline-none"
              >
                <option value="midterm">Midterm</option>
                <option value="attendance">Attendance</option>
                <option value="other">Assignment / Quiz / Other</option>
                <option value="final">Final Exam</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex items-center gap-1.5">
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={comp.maxMarks}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!Number.isNaN(val) && val > 0) {
                    updateItem(idx, { maxMarks: val });
                  }
                }}
                aria-label={`${comp.name} max marks`}
                className="w-full rounded-lg border-2 border-[#29232D] px-2.5 py-1.5 text-right font-mono text-xs font-extrabold tabular-nums text-[#29232D] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={template.length <= 1}
                className="rounded-lg p-1.5 text-[#29232D]/60 hover:bg-[#F8D0CC] hover:text-[#991B1B] disabled:opacity-30"
                aria-label={`Remove ${comp.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <div className="pt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-extrabold text-[#29232D]/70 mr-1">
            Add Component:
          </span>
          <button
            type="button"
            onClick={() => addItem('Midterm', 'midterm', 15)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2.5 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#E5D8F3]"
          >
            <Plus className="h-3 w-3" /> Midterm
          </button>
          <button
            type="button"
            onClick={() => addItem('Attendance', 'attendance', 10)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2.5 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#DDF3E0]"
          >
            <Plus className="h-3 w-3" /> Attendance
          </button>
          <button
            type="button"
            onClick={() => addItem('Assignment', 'other', 10)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2.5 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#FFF4D6]"
          >
            <Plus className="h-3 w-3" /> Assignment
          </button>
          <button
            type="button"
            onClick={() => addItem('Quiz', 'other', 10)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2.5 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#DCEFF8]"
          >
            <Plus className="h-3 w-3" /> Quiz
          </button>
          <button
            type="button"
            onClick={() => addItem('Final Exam', 'final', 50)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2.5 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#F8D0CC]"
          >
            <Plus className="h-3 w-3" /> Final Exam
          </button>
        </div>
      </div>
    </div>
  );
}
