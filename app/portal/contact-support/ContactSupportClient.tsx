"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type ContactSupportClientProps = {
  attachmentEnabled: boolean;
  accountNumber: string;
};

type FieldErrors = Partial<
  Record<"name" | "email" | "accountNumber" | "subject" | "message" | "attachment", string>
>;

const maxAttachmentSize = 5 * 1024 * 1024;

export function ContactSupportClient({ attachmentEnabled, accountNumber }: ContactSupportClientProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accountNumberValue, setAccountNumberValue] = useState(accountNumber);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  useEffect(() => {
    setAccountNumberValue(accountNumber);
  }, [accountNumber]);

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Name is required.";
    }
    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = "Enter a valid email.";
    }
    if (!accountNumberValue.trim()) {
      nextErrors.accountNumber = "Account number is required.";
    }
    if (!subject.trim()) {
      nextErrors.subject = "Subject is required.";
    }
    if (!message.trim()) {
      nextErrors.message = "Message is required.";
    }
    if (attachmentEnabled && attachment && attachment.size > maxAttachmentSize) {
      nextErrors.attachment = "Attachment exceeds the 5MB limit.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setAccountNumberValue(accountNumber);
    setSubject("");
    setMessage("");
    setAttachment(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setSaving(true);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("accountNumber", accountNumberValue.trim());
    formData.append("subject", subject.trim());
    formData.append("message", message.trim());
    if (attachmentEnabled && attachment) {
      formData.append("attachment", attachment);
    }

    const res = await fetch("/api/support/contact", {
      method: "POST",
      body: formData
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (data?.fieldErrors) {
        const nextErrors: FieldErrors = {};
        (Object.keys(data.fieldErrors) as Array<keyof FieldErrors>).forEach((key) => {
          const value = data.fieldErrors[key];
          if (Array.isArray(value) && value[0]) {
            nextErrors[key] = value[0];
          }
        });
        setErrors(nextErrors);
      }
      toast({
        title: data?.message ?? "Failed to send message. Please try again",
        variant: "error"
      });
      setSaving(false);
      return;
    }

    toast({ title: "Message sent successfully" });
    resetForm();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-brand-950">Contact Support</h2>
        <p className="mt-2 text-sm font-normal leading-relaxed text-brand-700">
          Send a message to the support team and we will respond as soon as possible.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support request</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-brand-700">Full Name</label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  className={errors.name ? "border-status-error focus:border-status-error" : undefined}
                />
                {errors.name ? <p className="mt-1 text-xs text-status-error">{errors.name}</p> : null}
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  className={errors.email ? "border-status-error focus:border-status-error" : undefined}
                />
                {errors.email ? <p className="mt-1 text-xs text-status-error">{errors.email}</p> : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-brand-700">Account Number</label>
                <Input
                  value={accountNumberValue}
                  readOnly
                  aria-readonly="true"
                  aria-invalid={Boolean(errors.accountNumber)}
                  className={errors.accountNumber ? "border-status-error focus:border-status-error" : undefined}
                />
                {errors.accountNumber ? (
                  <p className="mt-1 text-xs text-status-error">{errors.accountNumber}</p>
                ) : null}
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Subject</label>
                <Input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  aria-invalid={Boolean(errors.subject)}
                  className={errors.subject ? "border-status-error focus:border-status-error" : undefined}
                />
                {errors.subject ? (
                  <p className="mt-1 text-xs text-status-error">{errors.subject}</p>
                ) : null}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-brand-700">Message</label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                aria-invalid={Boolean(errors.message)}
                className={`min-h-[140px] w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-brand-900 shadow-sm placeholder:text-brand-600 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25 ${
                  errors.message ? "border-status-error focus:border-status-error" : ""
                }`}
              />
              {errors.message ? (
                <p className="mt-1 text-xs text-status-error">{errors.message}</p>
              ) : null}
            </div>

            {attachmentEnabled ? (
              <div>
                <label className="text-sm font-semibold text-brand-700">Attachment (optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="attachment"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && file.size > maxAttachmentSize) {
                      setAttachment(null);
                      setErrors((prev) => ({
                        ...prev,
                        attachment: "Attachment exceeds the 5MB limit."
                      }));
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                      return;
                    }
                    setErrors((prev) => ({ ...prev, attachment: undefined }));
                    setAttachment(file);
                  }}
                  className="mt-1 h-11 w-full rounded-lg border border-surface-200 bg-white px-3 text-sm leading-none file:mr-3 file:h-9 file:rounded-md file:border-0 file:bg-surface-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-800 file:leading-none file:translate-y-[1px]"
                />
                <p className="mt-1 text-xs text-brand-600">
                  Accepted: PDF, PNG, JPG, JPEG, DOC, DOCX. Max 5MB.
                </p>
                {errors.attachment ? (
                  <p className="mt-1 text-xs text-status-error">{errors.attachment}</p>
                ) : null}
              </div>
            ) : null}

            <div className="flex items-center justify-end">
              <Button type="submit" variant="accent" disabled={saving}>
                {saving ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
