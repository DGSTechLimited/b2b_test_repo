"use client";

import { useFormState } from "react-dom";
import type { DealerFormState } from "@/app/actions/admin";
import { AdminContentContainer } from "@/components/layout/AdminContentContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type DealerRow = {
  id: string;
  name: string;
  accountNo: string;
  band: string;
  userEmail: string;
  userStatus: string;
};

type DealersClientProps = {
  dealers: DealerRow[];
  onCreateDealer: (prevState: DealerFormState, formData: FormData) => Promise<DealerFormState>;
};

export function DealersClient({ dealers, onCreateDealer }: DealersClientProps) {
  const [state, formAction] = useFormState(onCreateDealer, { ok: true });

  return (
    <AdminContentContainer>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Manage dealer access</h2>
          <p className="mt-2 text-sm font-normal leading-relaxed text-brand-700">
            Create dealer logins and assign pricing bands.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Dealer Account</CardTitle>
          </CardHeader>
          <CardContent>
            {state.ok ? null : (
              <p className="mb-4 text-sm font-medium text-status-error">{state.error}</p>
            )}
            <form action={formAction} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-brand-700">Dealer name</label>
                <Input name="name" placeholder="Atlas Motors" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Account No</label>
                <Input name="accountNo" placeholder="ACCT-204" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Email</label>
                <Input name="email" type="email" placeholder="dealer@domain.com" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Temporary password</label>
                <Input name="password" type="password" placeholder="Minimum 8 characters" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Band</label>
                <Select name="band" required>
                  <option value="BAND_1">Band 1</option>
                  <option value="BAND_2">Band 2</option>
                  <option value="BAND_3">Band 3</option>
                  <option value="BAND_4">Band 4</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="accent">Create Dealer</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Dealers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.2em] text-brand-700">
                  <tr>
                    <th className="py-2">Dealer</th>
                    <th className="py-2">Account No</th>
                    <th className="py-2">Band</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dealers.map((dealer, index) => (
                    <tr
                      key={dealer.id}
                      className={`border-t border-surface-200 ${index % 2 === 0 ? "bg-surface-50" : "bg-white"}`}
                    >
                      <td className="py-2 font-semibold">{dealer.name}</td>
                      <td className="py-2">{dealer.accountNo}</td>
                      <td className="py-2">
                        <Badge variant="neutral">{dealer.band.replace("_", " ")}</Badge>
                      </td>
                      <td className="py-2">{dealer.userEmail}</td>
                      <td className="py-2">
                        <Badge variant={dealer.userStatus === "ACTIVE" ? "success" : "warning"}>
                          {dealer.userStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminContentContainer>
  );
}
