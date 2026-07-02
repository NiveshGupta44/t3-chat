"use client";

import * as React from "react";
import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button variant="ghost" size="icon" onClick={() => { console.log("clicked"); setTheme(theme === "light" ? "dark" : "light") }}>
      {theme === "light" ? <Sunset className="size-5" /> : <Sunrise className="size-5" />}
    </Button>
  )
}