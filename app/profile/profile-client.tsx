"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type ProfileData = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "DEALER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  mustChangePassword: boolean;
  dealerProfile: {
    dealerName: string;
    accountNo: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    genuineTier: string;
    aftermarketTier: string;
    brandedTier: string;
    dispatchMethodDefault?: string | null;
  } | null;
};

export function ProfileClient() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("/api/me");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters.", variant: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match.", variant: "error" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/me/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) {
      const data = await res.json();
      toast({ title: data.message ?? "Unable to change password.", variant: "error" });
      setSaving(false);
      return;
    }
    setSaving(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "Password updated." });
  };

  if (loading) {
    return <p className="text-sm text-brand-700">Loading profile...</p>;
  }

  if (!profile) {
    return <p className="text-sm text-brand-700">Profile unavailable.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-brand-950">My Profile</h2>
        <p className="mt-2 text-sm font-normal leading-relaxed text-brand-700">
          Review your account details and update your password.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-brand-700">
            <div className="flex justify-between gap-4">
              <span>Name</span>
              <span className="font-semibold text-brand-900">{profile.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Email</span>
              <span className="font-semibold text-brand-900">{profile.email}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>User Type</span>
              <span className="font-semibold text-brand-900">{profile.role}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Status</span>
              <Badge
                variant={
                  profile.status === "ACTIVE"
                    ? "success"
                    : profile.status === "SUSPENDED"
                      ? "danger"
                      : "warning"
                }
              >
                {profile.status}
              </Badge>
            </div>
            {profile.dealerProfile ? (
              <>
                <div className="flex justify-between gap-4">
                  <span>Company Name</span>
                  <span className="font-semibold text-brand-900">{profile.dealerProfile.dealerName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Account No</span>
                  <span className="font-semibold text-brand-900">{profile.dealerProfile.accountNo}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Default Shipping Method</span>
                  <span className="font-semibold text-brand-900">
                    {profile.dealerProfile.dispatchMethodDefault ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Genuine Tier</span>
                  <span className="font-semibold text-brand-900">
                    {profile.dealerProfile.genuineTier}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Aftermarket Tier</span>
                  <span className="font-semibold text-brand-900">
                    {profile.dealerProfile.aftermarketTier}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Branded Tier</span>
                  <span className="font-semibold text-brand-900">
                    {profile.dealerProfile.brandedTier}
                  </span>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-semibold text-brand-700">Current password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">New password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Confirm password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <Button type="submit" variant="accent" disabled={saving}>
                {saving ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
