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
  invoicePrefix?: string;
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
  invoicePrefix: z.string().optional(),
});

type EntityFormValues = z.infer<typeof entityFormSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("business");
  const { toast } = useToast();

  const { data: entities, isLoading: entitiesLoading } = useQuery<Entity[]>({
    queryKey: ["/api/entities"],
  });

  const entity = entities?.[0];

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
      invoicePrefix: entity?.invoicePrefix || "INV",
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

  const onSubmitEntity = (data: EntityFormValues) => {
    saveEntityMutation.mutate(data);
  };

  // Reset form when entity data loads
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
        invoicePrefix: entity.invoicePrefix || "INV",
      });
    }
  }, [entity, form]);

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
                            <Input placeholder="Bangalore" data-testid="input-city" {...field} />
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
                            <Input placeholder="Karnataka" data-testid="input-state" {...field} />
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
                            <Input placeholder="560001" data-testid="input-pincode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
