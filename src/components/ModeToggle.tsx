import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
	return (
		<Button
			variant="outline"
			size="icon"
			className="h-8 w-8"
			onClick={() => {
				const isDark = document.documentElement.classList.contains("dark");
				document.documentElement.classList.toggle("dark");
				localStorage.setItem("theme", isDark ? "light" : "dark");
			}}
		>
			<Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
			<Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}