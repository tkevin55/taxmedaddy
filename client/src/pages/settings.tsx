import { useState } from "react";
import { Building2, FileText, Link as LinkIcon, Users, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("business");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your business profile and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="business" data-testid="tab-business">
            <Building2 className="w-4 h-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger value="invoicing" data-testid="tab-invoicing">
            <FileText className="w-4 h-4 mr-2" />
            Invoicing
          </TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">
            <LinkIcon className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Your company information for invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legal-name">Legal Name</Label>
                  <Input id="legal-name" placeholder="My Company Pvt Ltd" data-testid="input-legal-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trade-name">Trade Name</Label>
                  <Input id="trade-name" placeholder="My Brand" data-testid="input-trade-name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    placeholder="29ABCDE1234F1Z5"
                    className="font-mono"
                    data-testid="input-gstin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN</Label>
                  <Input
                    id="pan"
                    placeholder="ABCDE1234F"
                    className="font-mono"
                    data-testid="input-pan"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" rows={3} data-testid="input-address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select>
                    <SelectTrigger id="state" data-testid="select-state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="karnataka">Karnataka (29)</SelectItem>
                      <SelectItem value="maharashtra">Maharashtra (27)</SelectItem>
                      <SelectItem value="tamil-nadu">Tamil Nadu (33)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" placeholder="560001" data-testid="input-pincode" />
                </div>
              </div>
              <div className="pt-4">
                <Button data-testid="button-save-business">Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
              <CardDescription>Payment information for invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Input id="bank-name" data-testid="input-bank-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input id="account-number" className="font-mono" data-testid="input-account-number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC Code</Label>
                  <Input id="ifsc" className="font-mono" data-testid="input-ifsc" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upi">UPI ID</Label>
                  <Input id="upi" placeholder="business@upi" data-testid="input-upi" />
                </div>
              </div>
              <div className="pt-4">
                <Button data-testid="button-save-bank">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Series</CardTitle>
              <CardDescription>Configure invoice numbering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">Invoice Prefix</Label>
                <Input
                  id="prefix"
                  placeholder="MAA/24-25/"
                  className="font-mono"
                  data-testid="input-invoice-prefix"
                />
                <p className="text-xs text-muted-foreground">
                  Next invoice will be: MAA/24-25/001
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="next-number">Next Invoice Number</Label>
                <Input
                  id="next-number"
                  type="number"
                  defaultValue="1"
                  className="font-mono"
                  data-testid="input-next-number"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reset Annually</Label>
                  <p className="text-xs text-muted-foreground">
                    Reset numbering on April 1st (Financial Year)
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-reset-annually" />
              </div>
              <div className="pt-4">
                <Button data-testid="button-save-invoicing">Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default HSN & Tax Rates</CardTitle>
              <CardDescription>Set default values for products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-hsn">Default HSN Code</Label>
                  <Input id="default-hsn" placeholder="9999" className="font-mono" data-testid="input-default-hsn" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-gst">Default GST Rate</Label>
                  <Select>
                    <SelectTrigger id="default-gst" data-testid="select-default-gst">
                      <SelectValue placeholder="Select rate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="28">28%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-4">
                <Button data-testid="button-save-defaults">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shopify Connection</CardTitle>
              <CardDescription>Connect your Shopify store to import orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">My Store</p>
                  <p className="text-sm text-muted-foreground">mystore.myshopify.com</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">● Connected</p>
                </div>
                <Button variant="outline" data-testid="button-disconnect-shopify">
                  Disconnect
                </Button>
              </div>
              <Button variant="outline" className="w-full" data-testid="button-add-shopify">
                + Add Another Store
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage user access and roles</CardDescription>
              </div>
              <Button size="sm" data-testid="button-invite-user">
                Invite User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Admin User', 'Finance Manager', 'Operations Staff'].map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{user}</p>
                      <p className="text-sm text-muted-foreground">{user.toLowerCase().replace(' ', '.')}@company.com</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select defaultValue={idx === 0 ? 'admin' : idx === 1 ? 'finance' : 'operations'}>
                        <SelectTrigger className="w-40" data-testid={`select-role-${idx}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="readonly">Read Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" data-testid={`button-remove-user-${idx}`}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure when you want to receive emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Order Synced</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when new orders are imported from Shopify
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-notify-orders" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Invoice Generated</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when invoices are created
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-notify-invoices" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Payment Received</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when payments are marked as received
                  </p>
                </div>
                <Switch data-testid="switch-notify-payments" />
              </div>
              <div className="pt-4">
                <Button data-testid="button-save-notifications">Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
