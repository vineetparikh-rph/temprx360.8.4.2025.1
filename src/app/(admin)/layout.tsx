"use client";

import React from "react";
import { SidebarProvider } from "@/context/SidebarContext";
import AppSidebar from "@/layout/AppSidebar";
import AppHeader from "@/layout/AppHeader";
import PasswordChangeWrapper from "@/components/auth/PasswordChangeWrapper";
import Backdrop from "@/layout/Backdrop";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PasswordChangeWrapper>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden">
          <AppSidebar />
          <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out lg:ml-[290px]">
            <AppHeader />
            <main className="flex-1 p-4 md:p-6 2xl:p-10">
              <div className="ml-4">
                {children}
              </div>
            </main>
          </div>
          <Backdrop />
        </div>
      </SidebarProvider>
    </PasswordChangeWrapper>
  );
}