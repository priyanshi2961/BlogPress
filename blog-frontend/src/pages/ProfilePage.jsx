import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { userApiService } from "../services/api";

const ProfilePage = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await userApiService.getProfile();
        setForm({
          username: me.username || "",
          email: me.email || "",
          firstName: me.firstName || "",
          lastName: me.lastName || "",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userApiService.updateProfile(form);
      alert("Profile updated");
    } catch (e1) {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto p-6">
          <div className="card p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-3xl mx-auto p-6">
        <div className="card p-6">
          <h1 className="text-2xl font-bold mb-4">My Profile</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">First name</label>
                <input
                  className="input"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Last name</label>
                <input
                  className="input"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
