"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  mobile: string;
}

const EMPTY: ProfileData = {
  firstName: "",
  lastName: "",
  email: "",
  countryCode: "+91",
  mobile: "",
};

/** A labelled, outlined field that mirrors the design in the reference mockup. */
function Field({
  label,
  value,
  onChange,
  readOnly,
  type = "text",
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly: boolean;
  type?: string;
  placeholder?: string;
  prefix?: React.ReactNode;
}) {
  return (
    <div className="relative rounded-lg border border-border bg-card px-3 pt-4 pb-1.5 focus-within:border-primary transition-colors">
      <label className="absolute -top-2 left-2.5 bg-card px-1 text-[11px] font-medium text-muted-foreground">
        {label} <span className="text-destructive">*</span>
      </label>
      <div className="flex items-center gap-2">
        {prefix}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none ${
            readOnly ? "cursor-default" : ""
          }`}
        />
      </div>
    </div>
  );
}

const PersonalInfoPage: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData>(EMPTY);
  const [draft, setDraft] = useState<ProfileData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load profile");
      setProfile(data);
      setDraft(data);
    } catch (e: any) {
      setError(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setProfile(data);
      setDraft(data);
      setEditing(false);
      toast.success("Personal information updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const ro = !editing;
  const view = editing ? draft : profile;
  const set = (k: keyof ProfileData) => (v: string) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="w-7 h-7 text-primary" /> Personal Information
        </h2>
        {!loading && !error && (
          editing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium flex items-center gap-2 hover:bg-muted/70"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 shadow-sm"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-1 font-medium">{error}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Make sure MongoDB is running and <code>MONGODB_URI</code> is set in <code>.env.local</code>.
            </p>
            <button
              onClick={load}
              className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-7">
            <Field label="First Name" value={view.firstName} onChange={set("firstName")} readOnly={ro} />
            <Field label="Last Name" value={view.lastName} onChange={set("lastName")} readOnly={ro} />
            <Field
              label="Email Address"
              type="email"
              value={view.email}
              onChange={set("email")}
              readOnly={ro}
              placeholder="name@example.org"
            />
            <Field
              label="Mobile number primary"
              value={view.mobile}
              onChange={set("mobile")}
              readOnly={ro}
              prefix={
                <span className="flex items-center gap-1.5 shrink-0 text-sm text-foreground">
                  <span aria-hidden>🇮🇳</span>
                  {view.countryCode}
                </span>
              }
            />
          </div>
        )}
      </motion.div>

      {!loading && !error && !editing && (
        <p className="text-xs text-muted-foreground mt-3">
          These details are read-only. Use <span className="font-medium">Edit</span> to update them.
        </p>
      )}
    </div>
  );
};

export default PersonalInfoPage;
