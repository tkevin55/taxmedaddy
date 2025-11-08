import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

type Entity = {
  id: number;
  legalName: string;
  displayName: string;
  gstin?: string;
  pan?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  invoicePrefix?: string;
};

type Bank = {
  id: number;
  label: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch?: string;
  upiId?: string;
  entityId?: number;
};

type Signature = {
  id: number;
  label: string;
  imageUrl: string;
  entityId?: number;
};

const entityFormSchema = z.object({
  legalName: z.string().min(1, "Legal name is required"),
  displayName: z.string().min(1, "Display name is required"),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  stateCode: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  invoicePrefix: z.string().optional(),
});

const bankFormSchema = z.object({
  label: z.string().min(1, "Label is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  ifsc: z.string().min(1, "IFSC code is required"),
  branch: z.string().optional(),
  upiId: z.string().optional(),
});

const signatureFormSchema = z.object({
  label: z.string().min(1, "Label is required"),
  imageUrl: z.string().url("Valid URL is required"),
});

type EntityFormValues = z.infer<typeof entityFormSchema>;
type BankFormValues = z.infer<typeof bankFormSchema>;
type SignatureFormValues = z.infer<typeof signatureFormSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("business");
  const { toast } = useToast();

  const { data: entities, isLoading: entitiesLoading } = useQuery<Entity[]>({
    queryKey: ["/api/entities"],
  });

  const { data: banks, isLoading: banksLoading } = useQuery<Bank[]>({
    queryKey: ["/api/banks"],
  });

  const { data: signatures, isLoading: signaturesLoading } = useQuery<Signature[]>({
    queryKey: ["/api/signatures"],
  });

  const entity = entities?.[0];
  const bank = banks?.[0];

  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: {
      legalName: entity?.legalName || "",
      displayName: entity?.displayName || "",
      gstin: entity?.gstin || "",
      pan: entity?.pan || "",
      addressLine1: entity?.addressLine1 || "",
      addressLine2: entity?.addressLine2 || "",
      city: entity?.city || "",
      state: entity?.state || "",
      stateCode: entity?.stateCode || "",
      pincode: entity?.pincode || "",
      phone: entity?.phone || "",
      email: entity?.email || "",
      website: entity?.website || "",
      logoUrl: entity?.logoUrl || "",
      invoicePrefix: entity?.invoicePrefix || "INV",
    },
  });

  const bankForm = useForm<BankFormValues>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: {
      label: bank?.label || "Primary Bank",
      bankName: bank?.bankName || "",
      accountNumber: bank?.accountNumber || "",
      ifsc: bank?.ifsc || "",
      branch: bank?.branch || "",
      upiId: bank?.upiId || "",
    },
  });

  const saveEntityMutation = useMutation({
    mutationFn: async (data: EntityFormValues) => {
      if (entity?.id) {
        return apiRequest("PUT", `/api/entities/${entity.id}`, data);
      } else {
        return apiRequest("POST", "/api/entities", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entities"] });
      toast({
        title: "Success",
        description: "Business profile saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save business profile",
        variant: "destructive",
      });
    },
  });

  const saveBankMutation = useMutation({
    mutationFn: async (data: BankFormValues) => {
      const payload = {
        ...data,
        entityId: entity?.id || null,
      };
      if (bank?.id) {
        return apiRequest("PUT", `/api/banks/${bank.id}`, payload);
      } else {
        return apiRequest("POST", "/api/banks", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      toast({
        title: "Success",
        description: "Bank details saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save bank details",
        variant: "destructive",
      });
    },
  });

  const onSubmitEntity = (data: EntityFormValues) => {
    saveEntityMutation.mutate(data);
  };

  const onSubmitBank = (data: BankFormValues) => {
    saveBankMutation.mutate(data);
  };

  // Reset forms when data loads
  useEffect(() => {
    if (entity) {
      form.reset({
        legalName: entity.legalName || "",
        displayName: entity.displayName || "",
        gstin: entity.gstin || "",
        pan: entity.pan || "",
        addressLine1: entity.addressLine1 || "",
        addressLine2: entity.addressLine2 || "",
        city: entity.city || "",
        state: entity.state || "",
        stateCode: entity.stateCode || "",
        pincode: entity.pincode || "",
        phone: entity.phone || "",
        email: entity.email || "",
        website: entity.website || "",
        invoicePrefix: entity.invoicePrefix || "INV",
      });
    }
  }, [entity, form]);

  useEffect(() => {
    if (bank) {
      bankForm.reset({
        label: bank.label || "Primary Bank",
        bankName: bank.bankName || "",
        accountNumber: bank.accountNumber || "",
        ifsc: bank.ifsc || "",
        branch: bank.branch || "",
        upiId: bank.upiId || "",
      });
    }
  }, [bank, bankForm]);

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
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitEntity)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="legalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="My Company Pvt Ltd" data-testid="input-legal-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="My Brand" data-testid="input-display-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gstin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GSTIN</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="29ABCDE1234F1Z5"
                              className="font-mono"
                              data-testid="input-gstin"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PAN</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ABCDE1234F"
                              className="font-mono"
                              data-testid="input-pan"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="Building, Street" data-testid="input-address-line1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input placeholder="Area, Landmark" data-testid="input-address-line2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Ranchi" data-testid="input-city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="Jharkhand" data-testid="input-state" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input placeholder="834009" data-testid="input-pincode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="stateCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State Code</FormLabel>
                          <FormControl>
                            <Input placeholder="20" data-testid="input-state-code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 8197155411" data-testid="input-phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@maachis.art" data-testid="input-email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="www.maachis.art" data-testid="input-website" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" data-testid="input-logo-url" {...field} />
                        </FormControl>
                        <FormMessage />
                        {field.value && (
                          <div className="mt-2 border rounded-lg p-3 bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-2">Logo Preview:</p>
                            <img
                              src={field.value}
                              alt="Company Logo"
                              className="h-16 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="invoicePrefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Prefix</FormLabel>
                        <FormControl>
                          <Input placeholder="INV" className="font-mono" data-testid="input-invoice-prefix" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      data-testid="button-save-business"
                      disabled={saveEntityMutation.isPending}
                    >
                      {saveEntityMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
              <CardDescription>Payment information for invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...bankForm}>
                <form onSubmit={bankForm.handleSubmit(onSubmitBank)} className="space-y-4">
                  <FormField
                    control={bankForm.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Primary Bank" data-testid="input-bank-label" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={bankForm.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="HDFC Bank" data-testid="input-bank-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="50200080109371" className="font-mono" data-testid="input-account-number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={bankForm.control}
                      name="ifsc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFSC Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="HDFC0000150" className="font-mono" data-testid="input-ifsc" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch</FormLabel>
                          <FormControl>
                            <Input placeholder="main road" data-testid="input-branch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="upiId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UPI ID</FormLabel>
                          <FormControl>
                            <Input placeholder="business@upi" data-testid="input-upi" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      data-testid="button-save-bank"
                      disabled={saveBankMutation.isPending}
                    >
                      {saveBankMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signature</CardTitle>
              <CardDescription>Upload signature image for invoices (PNG, 1:1 ratio recommended)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Upload your signature image and we'll include it in your invoices.</p>
                <p className="mt-2">For best results, use a PNG image with a 1:1 aspect ratio (square).</p>
              </div>
              {signatures && signatures.length > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={signatures[0].imageUrl}
                        alt="Signature"
                        className="h-16 w-16 object-contain border rounded"
                      />
                      <div>
                        <p className="font-medium">{signatures[0].label}</p>
                        <p className="text-xs text-muted-foreground">Current signature</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                <p>To add or update your signature, please upload the image file to your server and provide the URL below.</p>
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
