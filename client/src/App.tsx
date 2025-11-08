import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import Products from "@/pages/products";
import Invoices from "@/pages/invoices";
import InvoiceCreate from "@/pages/invoice-create";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/orders" component={Orders} />
      <Route path="/products" component={Products} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/invoices/new" component={InvoiceCreate} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Development: Auto-login for testing
  useEffect(() => {
    if (import.meta.env.DEV && !localStorage.getItem("auth_token")) {
      const attemptLogin = async () => {
        try {
          const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@example.com", password: "test123" }),
          });
          
          if (loginRes.ok) {
            const data = await loginRes.json();
            if (data.token) {
              localStorage.setItem("auth_token", data.token);
              window.location.reload();
            }
          } else if (loginRes.status === 401) {
            // User doesn't exist, create it
            const signupRes = await fetch("/api/auth/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accountName: "Test Company",
                name: "Test Admin",
                email: "test@example.com",
                password: "test123"
              }),
            });
            
            if (signupRes.ok) {
              const data = await signupRes.json();
              if (data.token) {
                localStorage.setItem("auth_token", data.token);
                window.location.reload();
              }
            }
          }
        } catch (error) {
          console.error("Auto-login failed:", error);
        }
      };
      
      attemptLogin();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between px-6 py-4 border-b">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                  <Router />
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
