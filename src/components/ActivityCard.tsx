import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityCardProps {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

const ActivityCard = ({ label, selected, disabled, onToggle }: ActivityCardProps) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.97 }}
    onClick={onToggle}
    disabled={disabled}
    className={cn(
      "relative w-full text-left rounded-lg border-2 p-4 transition-colors duration-200 font-body text-sm md:text-base",
      selected
        ? "border-primary bg-primary/10 shadow-md"
        : "border-border bg-card hover:border-primary/40",
      disabled && !selected && "opacity-50 cursor-not-allowed"
    )}
  >
    {selected && (
      <span className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
        <Check className="h-3.5 w-3.5 text-primary-foreground" />
      </span>
    )}
    {label}
  </motion.button>
);

export default ActivityCard;
